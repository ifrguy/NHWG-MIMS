// Requires official MongoShell 3.6+
// writes a gam batch file to standard out containing members that need to be
// added to the pilots mailing list.
// History:
// 12Mar20 MEG Created.

var db = db.getSiblingDB( 'NHWG');

// find all active pilots and join with cap email address
var cur = db.getCollection("MbrAchievements").aggregate(
    [
        { 
            "$match" : { 
                "AchvID" : 44, 
                "Status" : "ACTIVE"
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

var group = 'pilots@nhwg.cap.gov';
// print gam batch job of pilots to be added to the list
print( "# Add members to pilots group:" );
while ( cur.hasNext() ) {
    var m = cur.next();
    var email = m.email.toLowerCase().replace( / /g, "" );
    var groupMember = db.GoogleGroups.findOne( { group: group, email: email } );
    if ( groupMember ) { continue; }
    print( "# Add:", m.CAPID, m.NameLast+',', m.NameFirst );
    print( "gam update group", group, "add member", email );  
}
