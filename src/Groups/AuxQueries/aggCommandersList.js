// Stages that have been excluded from the aggregation pipeline query
__3tsoftwarelabs_disabled_aggregation_stages = [

	{
		// Stage 9 - excluded
		stage: 9,  source: {
			$out: "commandersGroupList"
		}
	},
]

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
			            Duty : /^Deputy Commander$/i
			        }, 
			        {
			            Duty : /^vice comm.*$/i
			        },
			        {
			            Duty : /^director of oper.*$/i
			        },
			        {
			            Duty : /^chief of staff/i
			        },
			        {
			            Duty : /^inspector gen/i
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
			$lookup: // Equality Match
			{
			    from: "Squadrons",
			    localField: "ORGID",
			    foreignField: "ORGID",
			    as: "unit"
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

		// Stage 6
		{
			$project: {
			    "CAPID" : 1,
			    "Name" : "$google.name.fullName", 
			    "primaryEmail" : "$google.primaryEmail",    
			    "Duty" : 1, 
			    "Level" : "$Lvl", 
			    "ORGID" : 1,
			    "Unit" : "$unit.SquadIDStr",
			    "Squadron" : "$unit.SquadName",
			}
		},

		// Stage 7
		{
			$unwind: {
			    path : "$Unit",
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 8
		{
			$unwind: {
			    path : "$Squadron",
			    preserveNullAndEmptyArrays : false // optional
			}
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
