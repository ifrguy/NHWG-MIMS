// Manage Incident Commander (IC) list
// History:
// 06Mar21 MEG Fixed problem member not actually removed from list
// 20Apr20 MEG Created.

var db = db.getSiblingDB('NHWG');
// Requires official MongoShell 3.6+

var ics = {};  //set of active IC's
var group = 'ic@nhwg.cap.gov';
var count = 0;

// Get cursor on pipeline for all active/training level 1,2,3 ICs
var cur = db.getCollection("MbrAchievements").aggregate(
    [
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
                "NameFirst" : "$member.NameFirst", 
                "NameLast" : "$member.NameLast", 
                "NameSuffix" : "$member.NameSuffix", 
                "Achievement" : "$achv.Achv", 
                "Status" : 1, 
                "AchvID" : 1, 
                "email" : "$google.primaryEmail"
            }
        }
    ], 
    { 
        "allowDiskUse" : false
    }
);

while ( cur.hasNext() ) { 
    var m = cur.next();
    ics[ m.email ] = { CAPID: m.CAPID, last: m.NameLast, first: m.NameFirst, suffix: m.NameSuffix };
}

// Check for new members to add to group
count = 0;
print( "# Add new members to:", group );
for ( e in ics ) {
    var m = db.GoogleGroups.findOne( { group: group, email: e } );
    if ( m ) { continue; }
    print( "# Adding member:", ics[ e ].CAPID, (db.Google.findOne( { "customSchemas.Member.CAPID": ics[ e ].CAPID } )) );
    print( "gam update group", group, "add member", e );
    count++;
}
print( "# Total members added:", count );

// Check for members to remove from group
print();
count = 0;
print( "## Remove members from:", group );
var cur = db.GoogleGroups.find( { group: group, role: 'MEMBER'} );

while ( cur.hasNext() ) {
    var m = cur.next();
//    print("email:", m.email );
    if ( m.email in ics ) { continue; }
    count++;
    print( "# Remove member:", "CAPID:",
	   db.Google.findOne( { primaryEmail: m.email } ).customSchemas.Member.CAPID,
	   db.Google.findOne( { primaryEmail: m.email } ).name.fullName, 'email:', m.email );
    print( "gam update group", group, "delete member", m.email );
}
print( "# Total members removed:", count );
