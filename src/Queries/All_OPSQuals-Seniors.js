db.getCollection("Member").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: // Find all active senior members with active or training status qualifications.
			{
			    MbrStatus: 'ACTIVE',
			    Type: 'SENIOR',
			}
		},

		// Stage 2
		{
			$lookup: // Uncorrelated Subqueries
			// (supported as of MongoDB 3.6)
			// Join on CAPID, select only ACTIVE or TRAINING Quals,
			// stuff them into the Quals array
			{
			    from: "MbrAchievements",
			    let: { capid: "$CAPID" },
			    pipeline: [ { $match: { $expr: { $and:[ { $eq:[ "$CAPID", "$$capid"] },{ $in: ["$AchvID",[55,57,61,63,67,68,69,70,71,75,76,81,124,125,126,127,128,189,190,193,]]}]}}},
			        { $match: { $expr: {
			            $or:[ { $eq:[ "$Status", "ACTIVE" ]},
			            { $eq: [ "$Status", "TRAINING"]}]
			        }}},
			        { $project: {_id:0, AchvID:1, Status:1}}
			        ],
			    as: "Quals"
			}
		},

		// Stage 3
		{
			$project: {
			    CAPID:1,NameLast:1,NameFirst:1,MiddleName:1,NameSuffix:1,Type:1,Quals:1
			}
		},

		// Stage 4
		{
			$unwind: {
			    path : "$Quals",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 5
		{
			$project: {
			    // specifications
			    CAPID: 1,
			    NameLast: 1,
			    NameFirst: 1,
			    NameSuffix: 1,
			    Type: 1,
			    Qual_ID: "$Quals.AchvID",
			    QualStat: "$Quals.Status",
			}
		},

		// Stage 6
		{
			$lookup: // Equality Match Join on AchvID to pull in achievement name strings
			{
			    from: "Achievements",
			    localField: "Qual_ID",
			    foreignField: "AchvID",
			    as: "Achievements"
			}
		},

		// Stage 7
		{
			$unwind: {
			    path : "$Achievements",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 8
		{
			$project: {
			    // specifications
			    CAPID: 1,
			    NameLast: 1,
			    NameFirst: 1,
			    NameSuffix: 1,
			    Type: 1,
			    Qual_ID: 1,
			    QualStat: 1,
			    Qualification: "$Achievements.Achv",
			    FunctionArea: "$Achievements.FunctionalArea",
			    
			}
		},

		// Stage 9
		{
			$sort: {
			    CAPID:1
			}
		},
	],

	// Options
	{
		collation: {
			
			locale: "en_US",
			strength: 1,
			caseLevel: false,
		}
	}

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
