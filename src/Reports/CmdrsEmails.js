// Create a collection with the latest list of unit commanders,
// deputies, personnel officers and recruiting. Excludes suspended accounts.
// Used for mailing of member reports.
db = db.getSiblingDB("NHWG");
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
                                }
			    ]
			}
		},

		// Stage 2 - Join
		{
			$lookup: {
			    "from" : "Google",
			    "localField" : "CAPID", 
			    "foreignField" : "externalIds.value", 
			    "as" : "google"
			}
		},

		// Stage 3 - Flatten google array
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
			    "Duty" : 1, 
			    "Level" : "$Lvl", 
			    "primaryEmail" : "$google.primaryEmail",
			    "Name" : "$google.name.fullName",
			    "ORGID" : 1,
			}
		},

		// Stage 6
		{
			$out: "reportEmailList"
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
