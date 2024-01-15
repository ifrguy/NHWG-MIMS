// Aircrew group
// Includes all qualified: AP, MO, MP, MS
//
// Instantiate group:
// default constructor args: group & memberpipeline
// aircrew = new Aircrew();

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 22Dec21 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'aircrew';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'MbrAchievements';

// MongoDB aggregation pipeline to find potential aircrew

const memberpipeline = [
        { 
            "$match" : { 
                "AchvID" : { 
                    "$in" : [
                        55, 
                        57, 
                        81, 
                        193
                    ]
                }, 
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

// Aircrew group
class Aircrew extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
		 start_agg = pipeline_start )
    {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

// Instantiate the group object to start everything
let theGroup = new Aircrew();
theGroup.updateGroup();

