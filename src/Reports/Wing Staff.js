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
