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
	    print( "Pilots:removeMembers overrides Group::removeMembers()" );
	    print( "Group members can only be removed by a group manager." );
	}
	return true;
    }
};

// Main

let theGroup = new Pilots();
theGroup.updateGroup();



