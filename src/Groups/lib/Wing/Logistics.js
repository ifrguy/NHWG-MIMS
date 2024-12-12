// Group: nh-logistics@nhwg.cap.gov
// Purpose: Corral wing logistics officers into a group

// History:
// 07Dec24 DJL Consolidate configuration files for single point changes.
// 22Feb24 MEG Created.


// Load my super class definition
load( './lib/Group.js');

// base name of the Google group
const { config } = require("../../../getConfig.js");
const group = config.wing.toLowerCase() + '-logistics';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'DutyPosition';

// MongoDB aggregation pipeline to find potential group members.
// The pipeline must result in objects that contain a valid email address
// for candidate members in the attribute named "email"
const memberpipeline = [
        {
            "$match" : {
                "FunctArea" : "LG"
            }
        }, 
        {
            "$lookup" : {
                "from" : "Member",
                "localField" : "CAPID",
                "foreignField" : "CAPID",
                "as" : "member"
            }
        }, 
        {
            "$unwind" : {
                "path" : "$member"
            }
        }, 
        {
            "$match" : {
                "member.MbrStatus" : "ACTIVE"
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
		"CAPID": 1,
                "Name" : "$google.name.fullName",
                "email" : "$google.primaryEmail",
                "Duty" : NumberInt(1),
                "Asst" : NumberInt(1),
                "Level" : "$Lvl",
                "ORGID" : NumberInt(1)
            }
        }
];

class Logistics extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main


// If we got here we must be in batch mode, so run the update.
// Instantiate the group object to start everything
let theGroup = new Logistics();

// if NOAUTORUNGROUP env var is set updateGroup() will simply return,
// this will allow for manual debugging in a mongosh session.
theGroup.updateGroup();
