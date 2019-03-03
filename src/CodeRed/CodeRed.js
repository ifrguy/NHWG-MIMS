// CodeRed - Scans CodeRed collections from new and expired members.
//
// History:
// 09Jan19 MEG moved "NEW" flag to Status field from Command.
//j
// The database
var DB = db.getSiblingDB( 'NHWG' );

// load string format function
load( DB.ENV.findOne( { name: 'stringFormat'} ).value );
// load date calc functions
load( DB.ENV.findOne( { name: 'DATEFNS'} ).value );


// The name of the Code Red collection
var collectionName = 'CodeRed';

// Code Red Contacts constructor
// Takes a member object from the Mongo aggregation pipeline
// and returns an object with all of the contacts in a single package.
//
function Contact( member ) {
    this.WorkEmail = (member.WorkEmail || null);
    this.CellPhone;
    this.TextNumber;
    this.HomePhone;
    this.WorkPhone;
    member.Contacts.forEach( ( v ) => {
	switch( v.Type ) {
	    case "CELL PHONE" : this.CellPhone = v.Contact;
	                        this.TextNumber = v.Contact;
	    break;
	    case "HOME PHONE" : this.HomePhone = v.Contact;
	    break;
	    case "WORK PHONE" : this.WorkPhone = v.Contact;
	};
    });
}

// Code Red group info object constructor
function Code_Red_Obj( quals, grp, suffix ) {
    this.quals = quals;     //Array of CAP achievement IDs to search for
    this.group = grp;     //Code Red Group name
    this.suffix = suffix;   //Code Red CustomKey suffix string
}
// Define any Code_Red_Obj methods here

// Array of all the Code Red groups and quals to process.
// To add a new group add a new Code_Red_Obj to the array.
var code_red_groups = [
    new Code_Red_Obj( [ 55,57,81,193 ],
		       'CAP-AIR',
		       'A'
		    ),
    new Code_Red_Obj( [75,76],
		      'CAP-COMM',
		      'C'
		    ),
    new Code_Red_Obj( [68,69,70,71,126,127],
		      'CAP-GT',
		      'G'
		    ),
    new Code_Red_Obj( [61,63,64,67,68,75,125,128,189,190],
		      'CAP-IMT',
		      'I'
		    ),
];

// Aggregation pipeline ( SQL like select/join )
// Note that aggregation will return one record for each qualification,
// so a member may have several records in the queue.  I don't care
// since I'm only interested in the class of qualifications.  Duplicates
// are just ignored by one means or another.

function getQualifiedMembers( db, quals ) {
// Aggregation pipeline to pull together member quals and contact info
// for creating Code Red records.
// db - the database to use.
// quals - an array of achievement ids to select members.
// Returns a cursor for all matching documents
//
    var cur = db.getCollection("MbrAchievements").aggregate(
	[
            { 
		"$match" : {
                    "Status" : "active", 
                    "AchvID" : {
			"$in" : quals
                    }
		}
            }, 
            { 
		"$lookup" : {
                    "from" : "MbrContact", 
                    "let" : {
			"capid" : "$CAPID", 
			"priority" : "primary"
                    }, 
                    "pipeline" : [
			{
                            "$match" : {
				"$expr" : {
                                    "$and" : [
					{
                                            "$eq" : [
						"$CAPID", 
						"$$capid"
                                            ]
					}, 
					{
                                            "$eq" : [
						"$Priority", 
						"$$priority"
                                            ]
					}
                                    ]
				}
                            }
			}, 
			{
                            "$project" : {
				"_id" : 0.0, 
				"Type" : 1.0, 
				"Priority" : 1.0, 
				"Contact" : 1.0
                            }
			}
                    ], 
                    "as" : "contact"
		}
            }, 
            { 
		"$lookup" : {
                    "from" : "Google", 
                    "localField" : "CAPID", 
                    "foreignField" : "externalIds.value", 
                    "as" : "Google"
		}
            }, 
	    {
		"$unwind" : {
                    "path" : "$Google", 
                    "preserveNullAndEmptyArrays" : false
		}
            }, 		
	    {
		"$project": {
		    // Attributes to project into final record
		    CAPID:1,
		    FirstName: "$Google.name.givenName",
		    LastName: "$Google.name.familyName",
		    Contacts: "$contact",
		    WorkEmail: "$Google.primaryEmail",
		}
	    },
            { 
		"$sort" : {
                    "CAPID" : 1
		}
            }
	], 
	{ 
            "allowDiskUse" : false
	}
    );
    return cur;
}

function init( collection ) {
// Initialize the Code Red collections for processing.
// Save old collection for diff, create new collection.
// Do housekeeping chores, etc.
    DB.getCollection( collection + "Prev" ).drop();
    DB.getCollection( collection ).renameCollection( collection + "Prev", true );
    DB.createCollection( collection,
			 { collation:
			   { locale:'en_US',
			     strength:NumberInt(1),
			     caseLevel:false,
			   }
			 });
}

function CodeRedMember( member, group ) {
// CodeRedMember object
// Creates a complete Code Red record from the
// result of the aggregation pipeline ready to insert into collection.
// Initialize all the code red fields in order.
    var contacts = new Contact( member );
    this.Command = null;
    this.CustomKey = member.CAPID + group.suffix;
    this.FirstName = member.FirstName;
    this.LastName = member.LastName;
    this.Groups = group.group;
    this.Tags = 'CAP';
    this.HomePhone = (contacts.HomePhone || null );
    this.WorkPhone = (contacts.WorkPhone || null );
    this.CellPhone = (contacts.CellPhone || null );
    this.OtherPhone = null;
    this.TextNumber = (contacts.CellPhone || null );
    this.MobileProvider = null;
    this.HomeEmail = null;
    this.WorkEmail = (contacts.WorkEmail || null );
    this.OtherEmail = null;
    this['Street Address'] = null;
    this.City = null;
    this.State = null;
    this.Zip = null;
    this.Zip4 = null;
    this.PreferredLanguage = "English";
    this.ContactId = null
}

// Mark members for deletion
function markDelete( coll ) {
// Check if member not in "New" collection,
// mark for deletion if not.
    var newCollection = coll;
    var prevCollection = coll + 'Prev';
    cursor = DB.getCollection( prevCollection ).find({}).sort( {CustomKey:1});
    while( cursor.hasNext() ) {
	mbr = cursor.next();
	rec = DB.getCollection( newCollection ).findOne({CustomKey : mbr.CustomKey});
	if ( !rec ) {
	    DB.getCollection( prevCollection ).update( { _id: mbr._id },
						       { $set: {
							   Command: 'DELETE'}
						       });
	};
    };
}

// Mark new members
function markNew( coll ) {
// Check if member not in "Prev" collection,
// mark as "NEW" in not.
    var newCollection = coll;
    var prevCollection = coll + 'Prev';
    cursor = DB.getCollection( newCollection ).find({}).sort( {CustomKey:1});
    while( cursor.hasNext() ) {
	mbr = cursor.next();
	rec = DB.getCollection( prevCollection ).findOne({CustomKey : mbr.CustomKey});
	if ( !rec ) {
	    DB.getCollection( newCollection ).update( { _id: mbr._id },
						       { $set: {
							   Status: 'NEW'}
						       });
	};
    };
};


// Here's where we do the work.
// Loop over the code_red_groups array and process each group separately.
// The old collection is saved and a new collection created for set operations.
// Members meeting quals are written to the new collection.  Afterwards we
// compare members in the old collection to the new collection.  Members not
// found in the new collection are marked for deletion from Code Red.

// Main function here
function main() {
// Process each Code Red group into it's own collection
// Duplicates are handled, or rather not handled simply by upserting
// over a previous record.

    var cursor;  // Mongo query results cursor
    var mbr;     // A single member record off the cursor
    var rec;     // New Code Red member record

    init( collectionName );  // initialize collections

    code_red_groups.forEach( ( grp,i,a ) => {
	cursor = getQualifiedMembers( DB, grp.quals );
	while ( cursor.hasNext() ) {
	    mbr = cursor.next();
	    rec = new CodeRedMember( mbr, grp );
	    DB.getCollection( collectionName ).update( { CustomKey:rec.CustomKey},
						     rec,
						     { upsert: 1,
						       multi : 0,
						     }
						   );
	};
    });

// Loop over code red groups
// check to see if members need to be deleted or added
    code_red_groups.forEach( ( g, i, a ) => {
	markNew( collectionName );
	markDelete( collectionName );
    });

// Exit
}

// run the main
main();
