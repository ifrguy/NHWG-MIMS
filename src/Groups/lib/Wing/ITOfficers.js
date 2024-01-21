// Group: itofficers@nhwg.cap.gov
// Purpose: IT Officers and assistants

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 29May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'itofficers';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'DutyPosition';

// MongoDB aggregation pipeline to find potential group members.
// The pipeline must result in objects that contain a valid email address
// for candidate members in the attribute named "email"
const memberpipeline = [
    // Stage 1
    {
	$match: {
	    Duty : /(^information)|(director of it)/i,
	    
	}
    },

    // Stage 2
    {
	$lookup: {
	    "from" : "Google",
	    "localField" : "CAPID", 
	    "foreignField" : "customSchemas.Member.CAPID", 
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
	$project: {
	    "CAPID" : 1,
	    "Name" : "$google.name.fullName", 
	    "email" : "$google.primaryEmail",    
	    "Duty" : 1, 
	    "Asst" : 1,
	    "Level" : "$Lvl", 
	    "ORGID" : 1,
	}
    },
];

// itofficers group
class ITOfficers extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new ITOfficers();
theGroup.updateGroup();

