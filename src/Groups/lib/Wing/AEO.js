// Group: aeo@nhwg.cap.gov
// Purpose: Aerospace Education Officers

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 29May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'aeo';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'DutyPosition';

// MongoDB aggregation pipeline to find potential group members
const memberpipeline = [
    // Stage 1
    {
	$match: {
	    Duty: /aerospace ed/i,
	}
    },

    // Stage 2 - Lookup the member in the Google collection
    {
	$lookup: {
	    "from" : "Google",
	    "localField" : "CAPID", 
	    "foreignField" : "customSchemas.Member.CAPID", 
	    "as" : "google"
	}
    },

    // Stage 3 - flatten the google array for easy of access
    {
	$unwind: {
	    "path" : "$google", 
	    "preserveNullAndEmptyArrays" : false
	}
    },

    // Stage 4 - only consider active accounts
    {
	$match: {
	    "google.suspended": false,
	}
    },

    // Stage 5 - project the final member record for futher processing
    //           The listed fields are MANDATORY
    {
	$project: {
	    "CAPID" : 1,
	    "Name" : "$google.name.fullName", 
	    "email" : "$google.primaryEmail",    
	    // you may add other fields here
	}
    },

];

// aeo group
class AEO extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new AEO();
theGroup.updateGroup();

