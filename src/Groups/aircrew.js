// Requires official MongoShell 3.6+
// writes a gam batch file to standard out containing members that need to be
// added to the aircrew mailing list, and members that need to be removed.
// History:
// 11Mar20 MEG Created.

var db = db.getSiblingDB( 'NHWG');
var count = 0;

// find all active aircrew and join with cap email address, mongo returns a cursor.
var cur = db.getCollection("MbrAchievements").aggregate(
    [
        { 
            "$match" : { 
                "AchvID" : { 
                    "$in" : [
                        55, 
                        57, 
                        81, 
                        193
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
                "NameLast": "$google.name.familyName",
                "NameFirst": "$google.name.givenName",
                "email" : "$google.primaryEmail"
            }
        },
        {
            "$sort": {
                "NameLast": 1,
            }
        }
    ], 
    { 
        "allowDiskUse" : false
    }
);

var group = 'aircrew@nhwg.cap.gov';

// build a set of member capid's and emails for later use
var memberSet = {};  // empty Set
while ( cur.hasNext() ) {
    var m = cur.next();
    memberSet[ m.email ] = { id: m.CAPID, last: m.NameLast, first: m.NameFirst };  //add member to the set
}

print( "# Add members to aircrew group:" );
count = 0;
for ( key in memberSet ) { 
    var groupMember = db.GoogleGroups.findOne( { group: group, email: key } );
    if ( groupMember ) { continue; }
    count++;
    print( "# ADD Member:", memberSet[ key ].id, memberSet[ key ].last+',', memberSet[ key ].first );
    print( "gam update group", group, "add member", key );
}
print( "#Total members to add:", count );

// Remove members no longer qualified.
count = 0;
print( "# Remove non-qualified members from aircrew group:" );
var cur = db.GoogleGroups.find( { group: 'aircrew@nhwg.cap.gov', role: 'MEMBER' } );
while ( cur.hasNext() ) {
    var groupMember = cur.next();
    if ( groupMember.email in memberSet ) {  // if member is in the set he is active
        continue;
    }
    var g = db.Google.findOne( { primaryEmail: groupMember.email } );
    count++;
    print( "# REMOVE Member:", g.customSchemas.Member.CAPID, g.name.fullName );
    print( "gam update group aircrew remove member", groupMember.email );
}
print( "# Total members to remove:", count );
