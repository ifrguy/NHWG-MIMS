load('./lib/Group.js');
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

var pipeline = 
    [
        {
            "$match" : {
                "Type" : "CADET",
                "MbrStatus" : "ACTIVE",
                "Unit" : unit,      // variable
            }
        }, 
        {
            "$sort" : {
                "CAPID" : 1
            }
        }, 
        {
            "$lookup" : {
                "from" : "MbrContact",
                "localField" : "CAPID",
                "foreignField" : "CAPID",
                "as" : "contact"
            }
        }, 
        {
            "$unwind" : {
                "path" : "$contact"
            }
        }, 
        {
            "$match" : {
                "contact.Type" : "CADET PARENT EMAIL",
                "contact.Priority" : "PRIMARY",
		"contact.DoNotContact" : false,
            }
        }, 
        {
            "$project" : {
                "CAPID" : 1,
                "Unit" : 1,
                "Type" : 1,
		"Name": { $concat: [ "$NameFirst", " ", "$NameLast" ]},
                "email" : "$contact.Contact",
            }
        }
    ]; 

var AggOptions =
    {
        "allowDiskUse" : false
    };

// unit charter number as a string must be supplied by --eval or other means
var unit_domain = unit + "." + wing_domain;

class Parents extends Group {
    constructor( domain, groupname, pipeline, start_agg ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

var theGroup = new Parents( unit_domain,
			    'parents',
			    pipeline, "Member" );

theGroup.updateGroup();
