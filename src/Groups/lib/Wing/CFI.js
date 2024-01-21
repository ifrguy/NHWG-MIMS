// Group: cfi
// Purpose: Select all active G-1000 rated instructor pilots, update cfi group

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 01Jul22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'cfi';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'MbrAchievements';

// MongoDB aggregation pipeline to find potential group members.
// The pipeline must result in objects that contain a valid email address
// for candidate members in the attribute named "email"
const memberpipeline = [
       { 
            "$match" : { 
                "AchvID" : 195, 
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

// cfi@nhwg.cap.gov group
class CFI extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new CFI();
theGroup.updateGroup();


