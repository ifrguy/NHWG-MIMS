db = db.getSiblingDB("NHWG");
db.getCollection("Member").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: { 
			      // Find active members primary email address
			    // Member selection here
			    MbrStatus:'EXPIRED',
			//    Type: 'SENIOR',
			 //    Type:'CADET',
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

		// Stage 12
		{
			$out: "Expired"
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
