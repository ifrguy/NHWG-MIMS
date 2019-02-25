// Stages that have been excluded from the aggregation pipeline query
__3tsoftwarelabs_disabled_aggregation_stages = [

	{
		// Stage 3 - excluded
		stage: 3,  source: {
			$unwind: {
			    path : "$contact",
			    preserveNullAndEmptyArrays : false // optional
			}
		}
	},
]

db.getCollection("MbrAchievements").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
			    Status: 'active',
			    AchvID: { $in: [55,57,81,193] }
			}
		},

		// Stage 2
		{
			$lookup: // Join
			{
			   from: "MbrContact",
			   let: { capid : "$CAPID", priority: 'primary' },
			   pipeline: [ { $match:
			                     { $expr: 
			                               { $and: [ 
			                                         { $eq: [ "$CAPID", "$$capid" ] },
			                                         { $eq: [ "$Priority", "$$priority"] }
			                                     ]
			                             }
			                   }
			                },
			           { $project: { _id:0, Type:1, Contact:1 }}
			        ],
			   as: "contact"
			}
		},

		// Stage 4
		{
			$lookup: // Equality Match
			{
			    from: "Google",
			    localField: "CAPID",
			    foreignField: "externalIds.value",
			    as: "Google"
			}
			
			// Uncorrelated Subqueries
			// (supported as of MongoDB 3.6)
			// {
			//    from: "Google",
			//    let: { capid: "$CAPID" },
			//    pipeline: [ { $match: : { $expr: { $eq: [ "$externalIds.name", "$$capid" ] } } } ],
			//    as: "<output array field>"
			// }
		},

		// Stage 5
		{
			$unwind: {
			    path : "$Google",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 6
		{
			$project: {
			    // specifications
			    CAPID:1,
			    FirstName: "$Google.name.givenName",
			    LastName: "$Google.name.familyName",
			    Contacts: "$contact",
			    WorkEmail: "$Google.primaryEmail",
			}
		},

		// Stage 7
		{
			$sort: {
			    CAPID: 1
			}
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
