db.DutyPosition.aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
			Lvl:'WING',Asst:0
			}
		},

		// Stage 2
		{
			$sort: {
				Duty:1
			}
		},

		// Stage 3
		{
			$lookup: // Equality Match
			{
			    from: "Google",
			    localField: "CAPID",
			    foreignField: "externalIds.value",
			    as: "cmdrs"
			}
		},

		// Stage 4
		{
			$project: {
			    // specifications
			    CAPID:1,ORGID:1,Duty:1,FunctArea:1,"cmdrs.primaryEmail":1,"cmdrs.name.givenName":1,"cmdrs.name.familyName":1
			}
		},

		// Stage 5
		{
			$unwind: {
			    path : "$cmdrs",
			    includeArrayIndex : "arrayIndex", // optional
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 6
		{
			$out: "wingheads"
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
