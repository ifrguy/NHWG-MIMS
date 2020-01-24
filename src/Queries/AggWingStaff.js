// Stages that have been excluded from the aggregation pipeline query
__3tsoftwarelabs_disabled_aggregation_stages = [

	{
		// Stage 6 - excluded
		stage: 6,  source: {
			$out: "WingStaff"
		}
	},
]

db.getCollection("DutyPosition").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
			    Lvl:'WING',
			    Asst:0
			}
		},

		// Stage 2
		{
			$lookup: // Equality Match
			{
			    from: "Google",
			    localField: "CAPID",
			    foreignField: "customSchemas.Member.CAPID",
			    as: "member"
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
			    path : "$member",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 4
		{
			$project: {
			    CAPID:1,
			    Duty:1,
			//    Asst:1,
			    Director: "$member.name.fullName",
			    Email: "$member.primaryEmail",
			}
		},

		// Stage 5
		{
			$sort: {
			    Duty:1
			}
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
