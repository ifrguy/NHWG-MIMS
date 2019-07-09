db.getCollection("Groups").aggregate(

	// Pipeline
	[
		// Stage 1
		{
			$match: {
				Group: 'allseniors@nhwg.cap.gov'
			}
		},

		// Stage 2
		{
			$unwind: {
			    path : "$Members",
			 //   includeArrayIndex : "arrayIndex", // optional
			    preserveNullAndEmptyArrays : false // optional
			}
		},

		// Stage 3
		{
			$project: {
			    // specifications
			    Email: "$Members"
			}
		},

	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
