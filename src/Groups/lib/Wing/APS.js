// Group: aps
//
// Airborne Photographers

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 29May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'aps';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'MbrAchievements';

// MongoDB aggregation pipeline to find potential members
const memberpipeline = [
    { 
        "$match" : { 
            "AchvID" : 193, 
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
            "path" : "$google"
        }
    }, 
    { 
        "$project" : { 
            "CAPID" : 1,
            "Status" : 1, 
            "AchvId" : 1, 
	    "Name" : "$google.name.fullName",
            "email" : "$google.primaryEmail"
        }
    }

];

// aps group
class APS extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new APS();
theGroup.updateGroup();


