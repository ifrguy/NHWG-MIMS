// Group: Staff
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

// Lookup all unit staff members, no assistants.

// History:
// 22Nov25 MEG Fixed to pull NHWG assigned email address.
// 26Sep25 MEG Created.


load('./lib/Group.js');

// Definitions
// unit charter number as a string must be supplied by --eval or other means
var unit_domain = unit + "." + wing_domain;
// Group email account name, e.g. 'seniors'
var unit_group_name = 'staff';

// Map unit to ORGID for pipeline
var orgid = db.getCollection( "orgUnitPath" ).findOne( { "Unit" : unit } ).ORGID;

var pipeline = 
    [
        // Stage 1
        {
            $match: {
                Lvl : 'UNIT',
                Asst : 0, 
                ORGID : orgid,
            }
        },

        // Stage 2
        {
            $lookup: {
                from: "Member",
                localField: "CAPID",
                foreignField: "CAPID",
                as: "member"
            }
        },

        // Stage 3
        {
            $unwind: {
                path: "$member",
            }
        },

        // Stage 4
	{
	    $lookup: {
		from: "Google",
		localField: "CAPID",
		foreignField: "customSchemas.Member.CAPID",
                as: "google"

            }
        },

        // Stage 5
        {
            $unwind: {
                path: "$google"
            }
        },

        // Stage 6
        {
            $project: {
                // specifications
                CAPID : 1,
                Lvl : 1,
                Status : "$member.MbrStatus",
                Unit : "$member.Unit",
                Name : "$google.name.fullName",
                Rank : "$member.Rank",
		Type : "$member.Type",
		Duty : 1,
                email : "$google.primaryEmail",
            }
	},
    ]; 

var AggOptions =
    {
        "allowDiskUse" : false
    };


class Staff extends Group {
    constructor( domain, groupname, pipeline, start_agg ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

var theGroup = new Staff( unit_domain,
			  unit_group_name,
			  pipeline, "DutyPosition" );
theGroup.updateGroup();

