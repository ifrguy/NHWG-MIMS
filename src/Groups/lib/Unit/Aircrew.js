// Unit level Aircrew groups

load('./lib/Group.js');

// Definitions
// unit charter number as a string must be supplied by --eval or other means
var unit_domain = unit + "." + wing_domain;
// Group email account name
var unit_group_name = 'aircrew';

// MongoDB member selection query
// We only look for AchvId 55 Mission Scanner as all aircrew must have MS.

var pipeline = 
    [
        { 
            "$match" : { 
                "AchvID" : 55,
                "$or" : [
                    { 
                        "Status" : "ACTIVE"
                    }, 
                    { 
                        "Status" : "TRAINING"
                    }
                ]
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

class Aircrew extends Group {
    constructor( domain, groupname, pipeline, start_agg ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

var theGroup = new Aircrew( unit_domain,
			    unit_group_name,
			    pipeline, "MbrAchievements" );
theGroup.updateGroup();

