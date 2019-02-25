db.getCollection("DutyPosition").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
			    Asst : NumberInt(0), 
			    "$or" : [
			        {
			            Duty : "Commander"
			        }, 
			        {
			            Duty : /^Deputy Commander.*$/i
			        }, 
			        {
			            Duty : /^Personnel Off.*$/i
			        },
			        {
			          	Duty : /^recruiting.*$/i
			        },
			    ]
			}
		},

		// Stage 2
		{
			$lookup: {
			    "from" : "Google",
			    "localField" : "CAPID", 
			    "foreignField" : "externalIds.value", 
			    "as" : "google"
			}
		},

		// Stage 3
		{
			$unwind: {
			    "path" : "$google", 
			    "preserveNullAndEmptyArrays" : false
			}
		},

		// Stage 4
		{
			$match: {
				"google.suspended": false,
			}
		},

		// Stage 5
		{
			$project: {
			    "CAPID" : 1,
			    "Name" : "$google.name.fullName", 
			    "primaryEmail" : "$google.primaryEmail",    
			    "Duty" : 1, 
			    "Level" : "$Lvl", 
			    "ORGID" : 1,
			}
		},

		// Stage 6
		{
			$out: "reportEmailList"
		},
	],

	// Options
	{
		collation: {
			
			locale: "en_US_POSIX",
			strength: 1,
			caseLevel: false,
		}
	}

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
