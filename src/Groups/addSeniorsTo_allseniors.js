var db = db.getSiblingDB( 'NHWG');

// Google Group of intereste
var baseGroupName = 'allseniors';
var googleGroup = baseGroupName + '@nhwg.cap.gov';
// Member type of interest
var mType = 'SENIOR';

// Aggregation pipeline find all ACTIVE member PRIMARY EMAIL addresses.
// Returns cursor
var contact = db.getCollection("Member").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
			    CAPID: { $gt: NumberInt(100000)},
			    Type: mType,
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
			//    includeArrayIndex : "arrayIndex", // optional
			    preserveNullAndEmptyArrays : false // optional
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
			//    includeArrayIndex : "arrayIndex", // optional
			    preserveNullAndEmptyArrays : false // optional
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
	]
);

while ( contact.hasNext() ) {
    var m = contact.next();
    var email = m.email.toLowerCase();
    var rx = new RegExp( email, 'i' );
    var g = db.getCollection("Groups").findOne( {Group: googleGroup, Members: rx });
    if ( g ) {
        continue;
    }
    else {
        print( '#Info:', m.CAPID, m.NameLast, m.NameFirst, m.NameSuffix );
        print("gam update group", googleGroup, "add member", email );
    }
}
