// Pilots group
//
// instantiate group:
// default args group & memberpipeline
// pilots = new Pilots();

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 26May22 MEG Completed.
// 22Dec21 MEG Created.

// Load my super class definition
load('./lib/Group.js');

const group = 'pilots';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'MbrAchievements';

// MongoDB aggregation pipeline to find all active pilots
const memberpipeline = [
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


// Pilots group
class Pilots extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
		 start_agg = pipeline_start )
    {
	super( domain, groupname, pipeline, start_agg );
    }

    removeMembers() {
	// This function does nothing.  Pilots are only removed
	// manually be group managers
	if ( DEBUG ) {
	    print( "Pilots: Overrides Group::removeMembers()" );
	    print( "Group members can only be removed by a group manager." );
	}
	return true;
    }
    updateGroup() {
	// We only ever add pilots to the group.
	// Only group managers remove pilots per the DO.
	// if NOAUTORUNGROUP is defined do not run the update, we must not
	// be in batch mode.
	if ( process.env.NOAUTORUNGROUP ) { return; }
	print( "# Update: " + this.myGroup + " Group" );
	this.addMembers();
    }
};

// Main

let theGroup = new Pilots();
theGroup.updateGroup();



