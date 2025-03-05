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

// Group: AEM

//
// Aerospace Education Members.  Teachers using CAP STEM products

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 28May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'aem';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'Member';

// MongoDB aggregation pipeline to find potential members
const memberpipeline = [
    { 
        "$match" : { 
            "Type" : "AEM", 
            "MbrStatus" : "ACTIVE"
        }
    }, 
    { 
        "$lookup" : { 
            "from" : "MbrContact", 
            "localField" : "CAPID", 
            "foreignField" : "CAPID", 
            "as" : "contacts"
        }
    }, 
    { 
        "$unwind" : { 
            "path" : "$contacts", 
            "preserveNullAndEmptyArrays" : true
        }
    }, 
    { 
        "$sort" : { 
            "NameLast" : 1
        }
    }, 
    { 
        "$match" : { 
            "contacts.Priority" : "PRIMARY", 
	    "contacts.Type" :  /^EMAIL/,
        }
    }, 
    // MANDATORY fields: CAPID, email, Name
    { 
        "$project" : { 
            "_id" : 0, 
            "CAPID" : 1, 
            "MbrType" : "$Type", 
            "email" : "$contacts.Contact", 
            "Name" : { 
                "$concat" : [
                    "$NameFirst", 
                    " ", 
                    "$NameLast"
                ]
            }
        }
    }
];

// aem group
class AEM extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new AEM();
theGroup.updateGroup();

