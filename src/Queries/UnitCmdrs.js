db.DutyPosition.aggregate(

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
			$lookup: // Equality Match
			{
			    from: "Squadrons",
			    localField: "ORGID",
			    foreignField: "Unit",
			    as: "squadron"
			}
		},

		// Stage 4
		{
			$project: {
			    // specifications
			    CAPID:1,ORGID:1,"cmdrs.primaryEmail":1,"cmdrs.name.givenName":1,"cmdrs.name.familyName":1,squadron:1
			}
		},

		// Stage 5
		{
			$out: "cammanditori"
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
