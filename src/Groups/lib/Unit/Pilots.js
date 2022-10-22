// Unit level Pilots groups

load('./lib/Group.js');

var pipeline = 
    [
       { 
            "$match" : { 
                "AchvID" : 44, 
                "Status" : "ACTIVE"
            }
        }, 
        { 
            "$lookup" : { 
                "from" : "Google", 
                "localField" : "CAPID", 
                "foreignField" : "customSchemas.Member.CAPID", 
                "as" : "google"
            }
        }, 
        { 
            "$unwind" : { 
                "path" : "$google", 
                "preserveNullAndEmptyArrays" : false
            }
        }, 
	{
	    "$match": {
		"google.customSchemas.Member.Unit": unit
	    }
	},	
        { 
            "$project" : { 
                "CAPID" : 1,
                "Name": "$google.name.fullName",
                "email" : "$google.primaryEmail"
            }
        },
        {

            "$sort": {
                "email": 1,
            }
        }
    ]; 

var AggOptions =
    {
        "allowDiskUse" : false
    };

// unit charter number as a string must be supplied by --eval or other means
var unit_domain = unit + "." + wing_domain;

class Pilots extends Group {
    constructor( domain, groupname, pipeline, start_agg ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

var theGroup = new Pilots( unit_domain,
			    'pilots',
			    pipeline, "MbrAchievements" );
theGroup.updateGroup();

