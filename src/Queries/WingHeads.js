// find Wing Duty Positions
const { config } = require("../getConfig.js");
var db = db.getSiblingDB(config.wing);//var cur = db.wingheads.find({});
// join DutyPosition to Google
var cur = db.DutyPosition.aggregate(
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

		// Stage 5 - Flatten cmdrs array for easier access
		{
			$unwind: {
			    path : "$cmdrs",
			    includeArrayIndex : "arrayIndex", // optional
			    preserveNullAndEmptyArrays : false // optional
			}
		},
	]

	// Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);
print( "Duty Position,CAPID,Name,eMail" );  
while( cur.hasNext() ) {
  r = cur.next();
  if ( r.cmdrs == null ) {
	  print( r.Duty + "\," + r.CAPID + "\," + "***UNKNOWN MEMBER***" );
  } else {
	  print( r.Duty + "\," + r.CAPID + "\," + r.cmdrs.name.givenName + " " + r.cmdrs.name.familyName + "\," + r.cmdrs.primaryEmail );
  }
}

