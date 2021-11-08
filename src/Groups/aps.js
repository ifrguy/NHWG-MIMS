// Find all AP's with ACTIVE or TRAINING status.  If not in aps group add,
// if not longer active remove.
var db = db.getSiblingDB( 'NHWG' );
var baseGroupName = 'aps';
var googleGroup = baseGroupName + '@nhwg.cap.gov';
var groupsCollection = 'GoogleGroups';
var Achvs = db.getCollection("MbrAchievements");
var achvIds = [ 193, ];
// This a left join
var activePipeline =  [
        { 
            "$match" : {
                "AchvID" : { "$in": achvIds }, 
             }
        }, 
        { 
            "$lookup" : {
                "from" : "Google", 
                "localField" : "CAPID", 
                "foreignField" : "customSchemas.Member.CAPID", 
                "as" : "GoogleMember"
            }
        }, 
        { 
            "$project" : {
                "CAPID" : "$CAPID", 
                "Status" : "$Status", 
                "Achv" : "$AchvID", 
                "Email" : "$GoogleMember.primaryEmail"
            }
        }, 
        { 
            "$unwind" : {
                "path" : "$Email", 
                "preserveNullAndEmptyArrays" : false
            }
        }
];

// aggregation pipeline options    
var options  = { 
        "allowDiskUse" : false
    };

function isActiveMember( capid ) {
    // Check to see if member is active.
    // This function needs to be changed for each group depending
    // on what constitutes "active".
    var m = db.getCollection( "Member").findOne( { "CAPID": capid, "MbrStatus": "ACTIVE" } );
    if ( m == null ) { return false; }
    return true;
					       
}

function addMembers( collection, pipeline, options, group ) {
    // Scans MbrAchivements looking for active/training member
    // if member is not currently on the mailing list generate gam command to add member.
    var cursor = collection.MbrAchievements.aggregate( pipeline, options );
    while ( cursor.hasNext() ) {
        var m = cursor.next();
        var email = m.Email.toLowerCase();
        var rx = new RegExp( email, 'i' );
        var g = db.getCollection( groupsCollection).findOne( { Group: group, Members: rx } );
        if ( g ) { continue; }
    // Print gam command to add new member
        print("gam update group", group, "add member", email );
    } 
}

function isQualified( capid, quals ) {
    var m = db.getCollection( "MbrAchievements").findOne( { "CAPID": capid, "AchvID": {"$in": quals} , "$or": [ { "Status": "ACTIVE" }, { "Status": "TRAINING" } ] } );
    if ( m  ) { return true; }
    return false;
}

function removeMembers( group, options ){
    // for each member of the group make sure member is active
    // check qualification status active/training,
    // if not generate a gam command to remove member
    var cur = db.getCollection( 'GoogleGroups' ).find( { 'group': group,
							 role: 'MEMBER'} );
    while ( cur.hasNext() ) {
        var e = cur.next().email;
        var rgx = new RegExp( e, "i" );
        var  g = db.Google.findOne( {primaryEmail: rgx} );
        var capid = g.customSchemas.Member.CAPID;
        if ( isActiveMember( capid ) && isQualified( capid, achvIds ) ) { continue; }
	print( "gam update group", group, "remove member", e );
    }
}

// Main here
print("# Update group:", googleGroup );
print("# Add new members");
addMembers( Achvs, activePipeline, options, googleGroup );
print("# Remove inactive members");
removeMembers( googleGroup, options );
