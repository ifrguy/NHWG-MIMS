db.getCollection("DutyPosition").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
				ORGID:855,
				Asst:0
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
		},

		// Stage 3
		{
			$lookup: // Equality Match
			{
			    from: "Google",
			    localField: "CAPID",
			    foreignField: "externalIds.value",
			    as: "google"
			}
		},

		// Stage 4
		{
			$unwind: {
			    path : "$member",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 5
		{
			$unwind: {
			    path : "$google",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 6
		{
			$project: {
			    // specifications
			    CAPID:1,
			    Duty:1,
			    "LastName": "$member.NameLast",
			    "FirstName":"$member.NameFirst",
			    "Suffix":"$member.NameSuffix",
			    "Rank":"$member.Rank",
			    "Email":"$google.primaryEmail",
			    
			}
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
