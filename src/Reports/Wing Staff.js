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


// WingOfficer.js
// Produces a csv file of all Wing staff officers
//
// History:
// 29Aug23 MEG Removed call to "getSiblingDB", DB now supplied on command line.
// 22May21 MEG Created.

var cur = db.getCollection("DutyPosition").aggregate(
    [
        { 
            "$match" : { 
                "Lvl" : "WING", 
                "Asst" : 0.0
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
            "$lookup" : { 
                "from" : "Google", 
                "localField" : "CAPID", 
                "foreignField" : "customSchemas.Member.CAPID", 
                "as" : "google"
            }
        }, 
        { 
            "$lookup" : { 
                "from" : "Squadrons", 
                "localField" : "ORGID", 
                "foreignField" : "ORGID", 
                "as" : "squadron"
            }
        }, 
        { 
            "$unwind" : { 
                "path" : "$member"
            }
        }, 
        { 
            "$unwind" : { 
                "path" : "$google"
            }
        }, 
        { 
            "$unwind" : { 
                "path" : "$squadron"
            }
        }, 
        { 
            "$project" : { 
                "CAPID" : 1.0, 
                "Duty" : 1.0, 
                "Rank" : "$member.Rank", 
                "Name" : { 
                    "$cond" : [
                        { 
                            "$eq" : [
                                "$member.NameSuffix", 
                                ""
                            ]
                        }, 
                        { 
                            "$concat" : [
                                "$member.NameFirst", 
                                " ", 
                                "$member.NameLast"
                            ]
                        }, 
                        { 
                            "$concat" : [
                                "$member.NameFirst", 
                                " ", 
                                "$member.NameLast", 
                                " ", 
                                "$member.NameSuffix"
                            ]
                        }
                    ]
                }, 
                "Email" : "$google.primaryEmail", 
                "Unit" : "$member.Unit", 
                "Squadron" : "$squadron.SquadName"
            }
        }, 
        { 
            "$sort" : { 
                "Duty" : 1.0
            }
        }
    ], 
    { 
        "allowDiskUse" : false
    }
);

// Print csv header
print( "Duty,Rank,Name,Email" );
while ( cur.hasNext() ) {
    rec = cur.next();
    print( rec.Duty + ',' + rec.Rank + ',' + rec.Name + ',' + rec.Email );
}
