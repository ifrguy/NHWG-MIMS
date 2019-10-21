db.getCollection("Member").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
				Type: 'CADET',
				MbrStatus: 'ACTIVE'
			}
		},

		// Stage 2
		{
			$lookup: // Equality Match
			{
			    from: "MbrContact",
			    localField: "CAPID",
			    foreignField: "CAPID",
			    as: "contacts"
			}
			
			// Uncorrelated Subqueries
			// (supported as of MongoDB 3.6)
			// {
			//    from: "<collection to join>",
			//    let: { <var_1>: <expression>, …, <var_n>: <expression> },
			//    pipeline: [ <pipeline to execute on the collection to join> ],
			//    as: "<output array field>"
			// }
		},

		// Stage 3
		{
			$unwind: {
			    path : "$contacts",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 4
		{
			$match: {
				"contacts.Priority": 'PRIMARY',
				"contacts.Type": 'CADET PARENT EMAIL',
			}
		},

		// Stage 5
		{
			$project: {
			    CAPID:1,
			    NameLast:1,
			    NameFirst:1,
			    NameMiddle:1,
			    NameSuffix:1,
			    ParentEmail: "$contacts.Contact",
			    ContactName: "$contacts.ContactName",
			    
			}
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
