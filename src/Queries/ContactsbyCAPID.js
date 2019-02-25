db.Member.aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
				CAPID: 462283
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
			
			// Uncorrelated Subqueries
			// (supported as of MongoDB 3.6)
			// {
			//    from: "<collection to join>",
			//    let: { <var_1>: <expression>, …, <var_n>: <expression> },
			//    pipeline: [ <pipeline to execute on the collection to join> ],
			//    as: "<output array field>"
			// }
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
