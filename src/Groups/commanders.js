//MongoDB script to Update the Commanders list.
//The list includes: Commanders, Deputy Commander, DO, IG, Chief of Staff
//Note: does not include assistants.
//History:
// 05Sep19 MEG Created.
var DEBUG = false;

var db = db.getSiblingDB( 'NHWG');

// Google Group of interest
var baseGroupName = 'commanders';
var googleGroup = baseGroupName + '@nhwg.cap.gov';
var groupsCollection = 'GoogleGroups';

// Aggregation pipeline find all commanders, deputies, etc.
var memberPipeline = 
    [
        { 
            "$match" : { 
                "Duty" : /^(Commander|vice commander|Deputy Commander|Chief of staff|Director of op|inspector general)/i,
                "Asst" : 0,
//               "Lvl" : "UNIT"
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
// Exlcuding MANAGER & OWNER roles, no group aristocrats

var groupMemberPipeline =
    [
        { 
            "$match" : {
                "group" : googleGroup,
		        "role" : 'MEMBER',
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
    // Get the list of all qualified potential members for the list
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
    // compare each member of the group against the authList
    // check active status, if not generate a gam command to remove member.
    // collection - name of collection holding all Google Group info
    // pipeline - array containing the pipeline to extract members of the target group
    // options - options for aggregations pipeline
    var m = db.getCollection( collection ).aggregate( pipeline, options );
    while ( m.hasNext() ) {
       	var e = m.next().email;
       	DEBUG && print("DEBUG::removeMembers::email",e);
       	var rgx = new RegExp( e, "i" );
       	if ( authMembers.includes( e ) ) { continue; }
        var r = db.getCollection( 'MbrContact' ).findOne( { Type: 'EMAIL', Priority: 'PRIMARY', Contact: rgx } );
       	if ( r ) {
    	    var a = db.getCollection( 'Member' ).findOne( { CAPID: r.CAPID } );
    	    DEBUG && print("DEBUG::removeMembers::Member.CAPID",a.CAPID,"NameLast:",a.NameLast,"NameFirst:",a.NameFirst);
       	    if ( a ) {
       	        print( '#INFO:', a.CAPID, a.NameLast, a.NameFirst, a.NameSuffix );       	
                print( 'gam update group', googleGroup, 'delete member', e );
       	    }
       }
    }
}


// Main here
print("# Update group:", googleGroup );
print("# Add new members");
var theAuthList = addMembers( "DutyPosition", memberPipeline, options, googleGroup );

DEBUG == true && print("DEBUG::theAuthList:", theAuthList);

print( "# Remove inactive members") ;
removeMembers( "GoogleGroups", groupMemberPipeline, options, googleGroup, theAuthList );
