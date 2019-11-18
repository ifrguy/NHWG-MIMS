//MongoDB scrip to Update allseniors group
//This should really be replaced by a new Class in mims.py
//History:
// 18Nov19 MEG Change temporal ordering of add and remove to fix Google issue.
// 19Aug19 MEG Created.

var db = db.getSiblingDB( 'NHWG');

// Google Group of intereste
var baseGroupName = 'allseniors';
var googleGroup = baseGroupName + '@nhwg.cap.gov';
var groupsCollection = 'GoogleGroups';
// Member type of interest
var memberType = 'SENIOR';
// import date math functions
load( db.ENV.findOne( {name:'DATEFNS'} ).value );
// look past 30 days expired members after this remove member from group.
var lookbackdate = dateFns.subDays( new Date(), 30 );


// Aggregation pipeline find all ACTIVE members PRIMARY EMAIL addresses.
var memberPipeline = 
	// Pipeline
	[
		// Stage 1
		{
			$match: {
			    CAPID: { $gt: NumberInt(100000)},
			    Type: memberType,
			    MbrStatus:"ACTIVE",
			}
		},

		// Stage 2
		{
			$lookup: // Equality Match
			{
			    from: "MbrContact",
			    localField: "CAPID",
			    foreignField: "CAPID",
			    as: "Contacts"
			}
			
		},

		// Stage 3
		{
			$unwind: {
			    path : "$Contacts",
			    preserveNullAndEmptyArrays : false
			}
		},

		// Stage 4
		{
			$match: {
			    "Contacts.Priority": "PRIMARY",
			    "Contacts.Type": "EMAIL",
			}
		},

		// Stage 5
		{
			$unwind: {
			    path : "$Contacts",
			    preserveNullAndEmptyArrays : false
			}
		},

		// Stage 6
		{
			$project: {
			    // specifications
			    CAPID:1,
			    NameLast:1,
			    NameFirst:1,
			    NameSuffix:1,
			    "email": "$Contacts.Contact",
			    
			}
		},
	];


// Aggregate a list of all emails for the Google group of interest
var groupMemberPipeline =
    [
        { 
            "$match" : {
                "group" : googleGroup
            }
        }, 
        { 
            "$project" : {
                "Email" : "$email"
            }
        }
    ];

// pipeline options
var options =  { "allowDiskUse" : false };

function isActiveMember( capid ) {
    // Check to see if member is active.
    // This function needs to be changed for each group depending
    // on what constitutes "active".
    var m = db.getCollection( "Member").findOne( { "CAPID": capid, "MbrStatus": "ACTIVE" } );
    if ( m == null ) { return false; }
    return true;
					       
}


function isGroupMember( group, email ) {
    // Check if email is already in the group
    var email = email.toLowerCase();
    var rx = new RegExp( email, 'i' );
    return db.getCollection( groupsCollection ).findOne( { 'group': group, 'email': rx } );
}

function addMembers( collection, pipeline, options, group ) {
    // Scans  looking for active members
    // if member is not currently on the mailing list generate gam command to add member.
    var cursor = db.getCollection( collection ).aggregate( pipeline, options );
    while ( cursor.hasNext() ) {
        var m = cursor.next();  
        if ( ! isActiveMember( m.CAPID ) ) { continue; }
        if ( isGroupMember( googleGroup, m.email ) ) { continue; }
        // Print gam command to add new member
        print("gam update group", googleGroup, "add member", m.email );
    } 
}

function removeMembers( collection, pipeline, options, group ) {
    // for each member of the group
    // check active status, if not generate a gam command to remove member.
    var m = db.getCollection( collection ).aggregate( pipeline, options );
    while ( m.hasNext() ) {
       	var e = m.next().Email;
       	var rgx = new RegExp( e, "i" );
       	var r = db.getCollection( 'MbrContact' ).findOne( { Type: 'EMAIL', Priority: 'PRIMARY', Contact: rgx } );
       	if ( r ) {
    	    var a = db.getCollection( 'Member' ).findOne( { CAPID: r.CAPID, Type: memberType } );
    	    if ( a == null || isActiveMember( r.CAPID ) ) { continue; }   		
       		if ( a.Expiration < lookbackdate ) {
       		    print( '#INFO:', a.CAPID, a.NameLast, a.NameFirst, a.NameSuffix, 'Expiration:', a.Expiration );
       	    	print( 'gam update group', googleGroup, 'delete member', e );
       		}
    	}
    	else {
       		    print( '#INFO: Unknown email:', e, 'removed' );
       	    	print( 'gam update group', googleGroup, 'delete member', e );
    	}
    	    
    }
}


// Main here
// Do NOT change the temporal order or remove and add operations.
// Google plays games with "." in user id's
print("# Update group:", googleGroup );
print( "# Remove inactive members") ;
removeMembers( groupsCollection, groupMemberPipeline, options, googleGroup );
print("# Add new members");
addMembers( "Member", memberPipeline, options, googleGroup );
