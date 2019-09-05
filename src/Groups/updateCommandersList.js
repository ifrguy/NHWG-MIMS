//MongoDB script to Update the Commanders list.
//The list includes: Commanders, Deputy Commander, DO, IG, Chief of Staff
//Note: does not include assistants.
//History:
// 05Sep19 MEG Created.

var db = db.getSiblingDB( 'NHWG');

// Google Group of intereste
var baseGroupName = 'commanders';
var googleGroup = baseGroupName + '@nhwg.cap.gov';
var groupsCollection = 'GoogleGroups';

// Aggregation pipeline find all commanders, deputies, etc.
var memberPipeline = 
    [
        { 
            "$match" : {
                "Asst" : NumberInt(0), 
                "$or" : [
                    {
                        "Duty" : "Commander"
                    }, 
                    {
                        "Duty" : /^Deputy Commander$/i
                    }, 
                    {
                        "Duty" : /^vice comm.*$/i
                    }, 
                    {
                        "Duty" : /^director of oper.*$/i
                    }, 
                    {
                        "Duty" : /^chief of staff/i
                    }, 
                    {
                        "Duty" : /^inspector gen/i
                    }
                ]
            }
        }, 
        { 
            "$lookup" : {
                "from" : "Google", 
                "localField" : "CAPID", 
                "foreignField" : "externalIds.value", 
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
            "$match" : {
                "google.suspended" : false
            }
        }, 
        { 
            "$lookup" : {
                "from" : "Squadrons", 
                "localField" : "ORGID", 
                "foreignField" : "ORGID", 
                "as" : "unit"
            }
        }, 
        { 
            "$project" : {
                "CAPID" : 1.0, 
                "Name" : "$google.name.fullName", 
                "email" : "$google.primaryEmail", 
                "Duty" : 1.0, 
                "Level" : "$Lvl", 
                "ORGID" : 1.0, 
                "Unit" : "$unit.SquadIDStr", 
                "Squadron" : "$unit.SquadName"
            }
        }, 
        { 
            "$unwind" : {
                "path" : "$Unit", 
                "preserveNullAndEmptyArrays" : false
            }
        }, 
        { 
            "$unwind" : {
                "path" : "$Squadron", 
                "preserveNullAndEmptyArrays" : false
            }
        }
    
]

// Aggregate a list of all emails for the Google group of interest
var groupMemberPipeline =
    [
        { 
            "$match" : {
                "group" : googleGroup
            }
        }, 
        { 
            "$project" : {
                "email" : "$email"
            }
        }
    ];

// pipeline options
var options =  { "allowDiskUse" : false };

function isActiveMember( capid ) {
    // Check to see if member is active.
    // This function needs to be changed for each group depending
    // on what constitutes "active".
    var m = db.getCollection( "Member").findOne( { "CAPID": capid, "MbrStatus": "ACTIVE" } );
    if ( m == null ) { return false; }
    return true;
					       
}


function isGroupMember( group, email ) {
    // Check if email is already in the group
    var email = email.toLowerCase();
    var rx = new RegExp( email, 'i' );
    return db.getCollection( groupsCollection ).findOne( { 'group': group, 'email': rx } );
}

function addMembers( collection, pipeline, options, group ) {
    // Scans  looking for active members
    // if member is not currently on the mailing list generate gam command to add member.
    // returns a list of members qualified to be on the list regardless of inclusion.
    var list = [];
    var cursor = db.getCollection( collection ).aggregate( pipeline, options );
    while ( cursor.hasNext() ) {
        var m = cursor.next();  
        if ( ! isActiveMember( m.CAPID ) ) { continue; }
        list.push( m.email );
        if ( isGroupMember( googleGroup, m.email ) ) { continue; }
        // Print gam command to add new member
        print("gam update group", googleGroup, "add member", m.email );
    }
    return list;
}

function removeMembers( collection, pipeline, options, group, authMembers ) {
    // for each member of the group against the authList
    // check active status, if not generate a gam command to remove member.
    var m = db.getCollection( collection ).aggregate( pipeline, options );
    while ( m.hasNext() ) {
       	var e = m.next().email;
       	var rgx = new RegExp( e, "i" );
       	if ( authMembers.includes( e ) ) { continue; }
        var r = db.getCollection( 'MbrContact' ).findOne( { Type: 'EMAIL', Priority: 'PRIMARY', Contact: rgx } );
       	if ( r ) {
    	    var a = db.getCollection( 'Member' ).findOne( { CAPID: r.CAPID } );
       	}
       	a == null || print( '#INFO:', a.CAPID, a.NameLast, a.NameFirst, a.NameSuffix );       	
        print( 'gam update group', googleGroup, 'delete member', e );
    }
}


// Main here
print("# Update group:", googleGroup );
print("# Add new members");
var theAuthList = addMembers( "DutyPosition", memberPipeline, options, googleGroup );
print( "# Remove inactive members") ;
removeMembers( "GoogleGroups", groupMemberPipeline, options, googleGroup, theAuthList );
