// UnitOfficers.js
// Produces a csv file of all the officers at the unit level
//
// History:
// 22May21 MEG Created
//

var db = db.getSiblingDB("NHWG");
var cur = db.DutyPosition.aggregate( [
        { 
            "$match" : { 
                "Lvl" : "UNIT", 
                "Asst" : 0
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
                "CAPID" : 1, 
                "Duty" : 1, 
                "Rank" : "$member.Rank", 
                "Name" : { 
                    "$cond" : [
                        { 
                            "$eq" : [
                                "$member.NameSuffix", ""
                            ]
                        }, 
                        { 
                            "$concat" : [
                                "$member.NameFirst", " ", "$member.NameLast"
                            ]
                        }, 
                        { 
                            "$concat" : [
                                "$member.NameFirst", " ", "$member.NameLast", " ", "$member.NameSuffix"
                            ]
                        }
                    ]
                }, 
                "Email" : "$google.primaryEmail", 
                "Unit" : { $concat: [ "NH-", "$member.Unit" ]},
                "Squadron" : "$squadron.SquadName"
            }
        }, 
        { 
            "$sort" : { 
                "Unit" : 1, 
                "Duty" : 1
            }
        }
    ], 
    { 
        "allowDiskUse" : false
    }
);

// print csv header
print( "Duty,Rank,Name,Email,Unit,Squadron");
while ( cur.hasNext() ) {
    rec = cur.next();
    print( rec.Duty + ',' + rec.Rank + ',' + rec.Name + ',' + rec.Email + ',' + rec.Unit + ',' + rec.Squadron );
}
