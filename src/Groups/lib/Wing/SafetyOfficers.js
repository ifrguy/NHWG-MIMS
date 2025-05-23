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

// Group: safetyofficers
// Purpose: List of all safety officers and assistants across all units

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 27May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'safetyofficers';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'DutyPosition';

// MongoDB aggregation pipeline to find potential group members.
// The pipeline must result in objects that contain a valid email address
// for candidate members in the attribute named "email"
const memberpipeline = [
    // Stage 1
    {
	$match: {
	    // enter query here
	    Duty: /safety/i,
//	    Asst: 0  //uncomment to exclude assistants
	}
    },

    // Stage 2
    {
	$lookup: // Equality Match
	{
	    from: "Google",
	    localField: "CAPID",
	    foreignField: "customSchemas.Member.CAPID",
	    as: "google"
	}
    },

    // Stage 3
    {
	$unwind: {
	    path: "$google",
	    preserveNullAndEmptyArrays: false, // optional
	}
    },

    // Stage 4
    {
	$project: {
	    // specifications
	    CAPID:1,
	    Asst: 1,
	    Duty: 1,
	    Name: "$google.name.fullName",
	    email: "$google.primaryEmail",
	    Unit: "$google.orgUnitPath",
	}
    },
];

// Safety Officers group
class SafetyOfficers extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new SafetyOfficers();
theGroup.updateGroup();


