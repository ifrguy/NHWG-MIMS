db.getCollection("DutyPosition").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
				Duty:'Commander',
				Lvl:'UNIT'
			}
		},

		// Stage 2
		{
			$lookup: // Equality Match
			{
			    from: "Google",
			    localField: "CAPID",
			    foreignField: "customSchemas.Member.CAPID",
			    as: "cmdr"
			}
		},

		// Stage 3
		{
			$lookup: // Equality Match
			{
			    from: "Squadrons",
			    localField: "ORGID",
			    foreignField: "ORGID",
			    as: "squadron"
			}
		},

		// Stage 4
		{
			$unwind: {
			    path : "$cmdr",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 5
		{
			$unwind: {
			    path : "$squadron",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 6
		{
			$project: {
			    // specifications
			    CAPID:1,
			    ORGID:1,
			    Unit : "$squadron.SquadIDStr",
			    Squadron : "$squadron.SquadName",
			    Commander : "$cmdr.name.fullName",
			//    NameFirst : "$cmdr.name.givenName",
			//    NameLast : "$cmdr.name.familyName",
			    Email : "$cmdr.primaryEmail",
			}
		},

		// Stage 7
		{
			$out: "UnitCommanders"
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
