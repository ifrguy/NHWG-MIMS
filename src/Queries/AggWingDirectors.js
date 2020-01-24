db.getCollection("DutyPosition").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
			    Duty:/^director/i
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
			    Asst:1,
			    Director: "$member.name.fullName",
			    Email: "$member.primaryEmail",
			}
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
