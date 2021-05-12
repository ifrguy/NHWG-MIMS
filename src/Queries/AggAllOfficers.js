db.getCollection("DutyPosition").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
			    // For AggAllOfficers to work you will need to have a "Squadrons" collection which contains at least these attributes:
			    // ORGID - Int32 ORGID assigned by National,
			    // SquadName - Str the name for the squadron,
			    // Optional additiona attributes:
			    // SquadIDStr - str the same as Member.Unit,
			    // Unit - Int32 Member.Unit as number
			//    Lvl: 'UNIT',
			    Asst: 0,
			}
		},

		// Stage 2
		{
			$lookup: // Equality Match
			{
			    from: "Member",
			    localField: "CAPID",
			    foreignField: "CAPID",
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
			$lookup: // Equality Match
			{
			    from: "Google",
			    localField: "CAPID",
			    foreignField: "customSchemas.Member.CAPID",
			    as: "google"
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

		// Stage 4
		{
			$lookup: // Equality Match
			{
			    from: "Squadrons",
			    localField: "ORGID",
			    foreignField: "ORGID",
			    as: "squadron"
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

		// Stage 5
		{
			$unwind: {
			    path: "$member",
			}
		},

		// Stage 6
		{
			$unwind: {
			    path: "$google",
			}
		},

		// Stage 7
		{
			$unwind: {
			    path: "$squadron",
			}
		},

		// Stage 8
		{
			$project: {
			    CAPID:1,
			    Duty:1,
			    Rank: "$member.Rank",
			    NameFirst: "$member.NameFirst",
			    NameLast: { $cond: [ { $eq: [ "$member.NameSuffix", "" ] },
			         "$member.NameLast",
			         { $concat: [ "$member.NameLast", " ", "$member.NameSuffix" ] } ] },
			    Email: "$google.primaryEmail",
			    Unit: "$member.Unit",
			    Squadron: "$squadron.SquadName",
			    
			}
		},

		// Stage 9
		{
			$sort: {
			    Unit:1,
			    Duty:1,
			    
			}
		},

		// Stage 10
		{
			$out: // Note: must be last stage of pipeline
			"AllUnitOfficers"
		},
	],

	// Options
	{

	}

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
