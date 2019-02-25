// Stages that have been excluded from the aggregation pipeline query
__3tsoftwarelabs_disabled_aggregation_stages = [

	{
		// Stage 3 - excluded
		stage: 3,  source: {
			$lookup: // Equality Match
			//{
			//    from: "MbrContact",
			//    localField: "CAPID",
			//    foreignField: "CAPID",
			//    as: "Contacts"
			//}
			
			// Uncorrelated Subqueries
			// (supported as of MongoDB 3.
			{
			    from: "MbrContact",
			    let: { capid: "$CAPID", ct: 'email', priority: 'primary' },
			    pipeline: [ { $match: {
			    	$expr: {
			      		$and: [ { $eq: [ "$CAPID", "$$capid" ]},
			      	  			{ $eq: [ "$Type", "$$ct" ]},
			      	  			{ $eq: [ "$Priority", "$$priority" ]}
			    		]
			    	}
			    }},
			    { $project: { _id:0,Contact:1 }}
			    ],
			    as: "contact"
			}
		}
	},

	{
		// Stage 4 - excluded
		stage: 4,  source: {
			$unwind: {
			    path : "$contact",
			    preserveNullAndEmptyArrays : false // optional
			}
		}
	},

	{
		// Stage 5 - excluded
		stage: 5,  source: {
			$project: {
			    // specifications
			    _id: 0,
			    CAPID:1,
			    NameLast:1,
			    NameFirst:1,
			    NameMiddle:1,
			    NameSuffix:1,
			    Type:1,
			    Rank:1,
			    EMAIL: "$contact.Contact"
			}
		}
	},
]

db.getCollection("Member").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
				MbrStatus: 'active',
			//	Type: 'senior',
			}
		},

		// Stage 2
		{
			$lookup: // Equality Match
			//{
			//    from: "MbrContact",
			//    localField: "CAPID",
			//    foreignField: "CAPID",
			//    as: "contact"
			//}
			
			// Uncorrelated Subqueries
			// (supported as of MongoDB 3.6)
			// Retrieve all member contacts
			 {
			    from: "MbrContact",
			    let: { capid : "$CAPID" },
			    pipeline: [ {$match: { $expr: { $eq: [ "$CAPID", "$$capid" ] } } },
				{ $project: { _id:0, Type:1, Priority:1, Contact:1 }}
			 	],
			    as: "contact"
			 }
		},

		// Stage 6
		{
			$sort: {
				NameLast:1
			}
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
