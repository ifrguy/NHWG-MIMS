// Find and report all expired memberships from lookback_day ago
// to the first day of the current month.

// History:
// 01Aug25 MEG Changed selection to data range (lookback_days) from
//             MbrStatus == EXPIRED.
// 29Aug23 MEG "getSiblingDB" call removed, DB passed on command line.

load( db.ENV.findOne({name:'DATEFNS'}).value );
load( db.ENV.findOne({name:'stringFormat'}).value );
// Keyword template string
var ktemplate = '{capid},{namelast},{namefirst},{type},{unit},{expiration},{email},{homephone}';
// Positional notation template string
var ptemplate = '{0},{1},{2},{3},{4},{5},{6},{7}';
var lookback_days = 90;
// First day of today's month
var end_date = dateFns.startOfMonth( new Date() );
// First day of month lookback_days ago
var begin_date = dateFns.startOfMonth( dateFns.subDays( end_date, lookback_days ));
//print("start:", start, "future:", future );
print('CAPID,NameLast,NameFirst,Type,Unit,Expiration,Email,HomePhone');

var pipeline = db.getCollection("Member").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: { 
			    // Member selection here
		             $and: [
				        { "Expiration": {
					    "$gte" : begin_date
					}
					},
				        { "Expiration" : {
					    "$lt" : end_date
					}
					}
			    ]
			    }
		},

		// Stage 2
		{
			$lookup: // Join Member and MbrContact on the CAPID field
			{
			    from: "MbrContact",
			    localField: "CAPID",
			    foreignField: "CAPID",
			    as: "contacts"
			}
		},

		// Stage 3
		{
			$project: {
			    _id:0,
			    CAPID:1,
			    NameFirst:1,
			    NameLast:1,
			    NameSuffix:1,
			    Type:1,
			    Unit:1,
			    Expiration:1,
			    contacts:1
			    // specifications
			}
		},

		// Stage 4
		{
			$unwind: {
			  // Flatten the contacts result array
			    path : "$contacts",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 5
		{
			$project: {
			   "_id":0,
			   "CAPID":1,
			   "NameLast":1,
			   "NameFirst":1,
			   "NameSuffix":1,
			   "Type":1,
			   "Unit":1,
			   "Expiration":1,
			   "CType":"$contacts.Type",
			   "Priority":"$contacts.Priority",
			   "Contact":"$contacts.Contact",
			}
		},

		// Stage 6
		{
			$match: {
			    "CType":'EMAIL',
			    "Priority":'PRIMARY',
			}
		},

		// Stage 7
		{
			$project: {
			// select only the fields you want in the final collection here
			    "_id":0,
			    CAPID:1,
			    "NameLast": {$cond: { if: { $eq: ["$NameSuffix", ""]}, then: "$NameLast", else: {$concat: ["$NameLast", " ", "$NameSuffix"]}}},
			    NameFirst:1,
			    Type:1,
			    Unit:1,
			    Expiration:1,
			    "EMAIL":"$Contact", // rename Contact field to EMAIL
			}
		},

		// Stage 8
		{
			$lookup:
			// Uncorrelated Subqueries
			// (supported as of MongoDB 3.6)
			{
				from: "MbrContact",
			    let: { capid:"$CAPID"},
			    pipeline: [ { $match: {
			    	$expr: {
			    		$and: [
			    			{ $eq: ["$CAPID", "$$capid" ] },
			    			{ $eq: [ "$Type", "HOME PHONE" ] },
			    			{ $eq: [ "$Priority", "PRIMARY" ] }
			    			]
			    		}
			    	}
			    },
			    	{$project: { Contact:1 }} ],
			    as: "contact"
			}
		},

		// Stage 9
		{
			$unwind: {
			    path : "$contact",
			    preserveNullAndEmptyArrays : true // optional
			}
		},

		// Stage 10
		{
			$project: {
			// select only the fields you want in the final collection here
			    "_id":0,
			    CAPID:1,
			    NameLast:1,
			    NameFirst:1,
			    Type:1,
			    Unit:1,
			    Expiration:1,
			    EMAIL:1,
			    HomePhone: "$contact.Contact",
			}
		},

		// Stage 11
		{
			$sort: {
			    "Unit":1,
			    "NameLast":1
			}
		},
	]
);

while ( pipeline.hasNext() ) {
    var m = pipeline.next();
    print( ptemplate.formatUnicorn( m.CAPID,
				    m.NameLast,
				    m.NameFirst,
				    m.Type,
				    m.Unit,
				    (m.Expiration.getUTCMonth() + 1 ) + '/' + (m.Expiration.getUTCDate()) + '/' + (m.Expiration.getUTCFullYear()),
				    m.EMAIL ? m.EMAIL : "UNKNOWN",
				    m.HomePhone ? m.HomePhone : "UNKNOWN" ));
}
