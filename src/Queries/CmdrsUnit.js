db.getCollection("DutyPosition").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
			Duty:'Commander', Lvl:'UNIT'
			}
		},

		// Stage 2
		{
			$lookup: // Equality Match
			{
			    from: "Google",
			    localField: "CAPID",
			    foreignField: "externalIds.value",
			    as: "cmdrs"
			}
		},

		// Stage 3
		{
			$unwind: {
			    path : "$cmdrs",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 4
		{
			$project: {
			    // specifications
			    CAPID:1,ORGID:1,
			    "Email": "$cmdrs.primaryEmail",
			    "NameFirst": "$cmdrs.name.givenName",
			    "NameLast":"$cmdrs.name.familyName"
			}
		},

		// Stage 5
		{
			$out: "cammanditori"
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
