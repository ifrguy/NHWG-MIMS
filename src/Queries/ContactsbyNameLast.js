// Stages that have been excluded from the aggregation pipeline query
__3tsoftwarelabs_disabled_aggregation_stages = [

	{
		// Stage 6 - excluded
		stage: 6,  source: {
			$out: "contacts"
		}
	},
]

db.getCollection("Member").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
			    NameLast: { $regex:/brown/i }
			}
		},

		// Stage 2
		{
			$match: {
				NameFirst: { $regex: /wal/i }
			}
		},

		// Stage 3
		{
			$sort: {
			CAPID:1
			}
		},

		// Stage 4
		{
			$lookup: // Equality Match
			{
			    from: "MbrContact",
			    localField: "CAPID",
			    foreignField: "CAPID",
			    as: "Contacts"
			}
		},

		// Stage 5
		{
			$lookup: // Equality Match
			{
			    from: "MbrAddresses",
			    localField: "CAPID",
			    foreignField: "CAPID",
			    as: "Addresses"
			}
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
