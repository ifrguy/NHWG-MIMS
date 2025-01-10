// Group: Public Affairs
// Purpose: Update the list of Public Affairs Officers wing wide.

// At a minimum the memberpipeline (join) must emit the field "email" contain
//the members email address.  Other fields are optional.

// History:
// 09Jan25 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the Google group
const group = 'publicaffairs';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'DutyPosition';

// MongoDB aggregation pipeline to find potential group members.
// The pipeline must result in objects that contain a valid email address
// for candidate members in the attribute named "email"
const memberpipeline = [
        {
            "$match" : {
                "Duty" : /Public Affairs/,
                "Asst" : NumberInt(0)
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
            "$match" : {
                "google.suspended" : false,
            }
        }, 
        {
            "$project" : {
                "CAPID" : NumberInt(1),
                "Duty" : NumberInt(1),
                "Level" : "$Lvl",
                "Rank" : "$member.Rank",
                "Name" : "$google.name.fullName",
                "email" : "$google.primaryEmail",
                "Unit" : "$member.Unit"
            }
        }
];

class PublicAffairs extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

// If we got here we must be in batch mode, so run the update.
// Instantiate the group object to start everything
let theGroup = new PublicAffairs();

// if NOAUTORUNGROUP env var is set updateGroup() will simply return,
// this will allow for manual debugging in a mongosh session.
theGroup.updateGroup();
