// Copyright 2025 Marshall E. Giguere
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       https://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.

// IC (Incident Commanders) group

//
// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 26May22 MEG Updated member pipeline to sort on email.
// 24Dec21 MEG Created.

// Load my super class definition
load( './lib/Group.js');

// Group base name
const group = 'ic';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'MbrAchievements';

// MongoDB aggregation pipeline to find potential group members
const memberpipeline =  [
        { 
            "$match" : { 
                "AchvID" : { 
                    "$in" : [
                        61, 
                        125, 
                        128
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
                "from" : "Member", 
                "localField" : "CAPID", 
                "foreignField" : "CAPID", 
                "as" : "member"
            }
        }, 
        { 
            "$unwind" : { 
                "path" : "$member", 
                "preserveNullAndEmptyArrays" : false
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
            "$lookup" : { 
                "from" : "Achievements", 
                "localField" : "AchvID", 
                "foreignField" : "AchvID", 
                "as" : "achv"
            }
        }, 
        { 
            "$unwind" : { 
                "path" : "$google", 
                "preserveNullAndEmptyArrays" : false
            }
        }, 
        { 
            "$unwind" : { 
                "path" : "$achv", 
                "preserveNullAndEmptyArrays" : false
            }
        }, 
        { 
            "$project" : { 
                "CAPID" : 1, 
                "Name" : "$google.name.fullName", 
                "Achievement" : "$achv.Achv", 
                "Status" : 1, 
                "AchvID" : 1, 
                "email" : "$google.primaryEmail"
            }
        },
       {
	"$sort" : { "email" : 1 }
       },
];


// Incident Commanders group
class IC extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start )
    {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new IC();
theGroup.updateGroup();

