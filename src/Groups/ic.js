// Manage Incident Commander (IC) list
// History:
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
                        61.0, 
                        125.0, 
                        128.0
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
                "CAPID" : 1.0, 
                "NameFirst" : "$member.NameFirst", 
                "NameLast" : "$member.NameLast", 
                "NameSuffix" : "$member.NameSuffix", 
                "Achievement" : "$achv.Achv", 
                "Status" : 1.0, 
                "AchvID" : 1.0, 
                "Email" : "$google.primaryEmail"
            }
        }
    ], 
    { 
        "allowDiskUse" : false
    }
);

while ( cur.hasNext() ) { 
    var m = cur.next();
    ics[ m.Email ] = { CAPID: m.CAPID, last: m.NameLast, first: m.NameFirst, suffix: m.NameSuffix };
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
    if ( m.email in ics ) { continue; }
    count++;
    print( "# Remove member:", ics[ m.email ].CAPID, db.Google.findOne( { primaryEmail: m.email } ).name.fullName );
}
print( "# Total members to remove:", count );




