// Group: wingstaff@nhwg.cap.gov
// Purpose: All wing staff members no assistants

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 30May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'wingstaff';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'DutyPosition';

// MongoDB aggregation pipeline to find potential group members.
// The pipeline must result in objects that contain a valid email address
// for candidate members in the attribute named "email"
const memberpipeline = [
    { 
        "$match" : { 
            "Lvl" : "WING", 
            "Asst" : 0
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
            "Duty" : 1, 
            "Asst" : 1, 
            "Name" : "$google.name.fullName", 
            "email" : "$google.primaryEmail"
        }
    }, 
];

// wingstaff group
class WingStaff extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new WingStaff();
theGroup.updateGroup();

