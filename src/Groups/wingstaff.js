//MongoDB script to Update the Wing Staff list.
//The list includes all Wing Level staff members
//Note: does not include assistants.
//History:
// 15Nov21 MEG Clean spaces from email addresses.
// 20Apr21 MEG Added check for held members.
// 03Sep20 MEG Created.
var DEBUG = false;

var db = db.getSiblingDB( 'NHWG');

// Google Group of interest
var baseGroupName = 'wingstaff';
var googleGroup = baseGroupName + '@nhwg.cap.gov';
var groupsCollection = 'GoogleGroups';
var holdsCollection = 'GroupHolds';

// Aggregation pipeline find all wing staff members as 
var memberPipeline = 
    [
        { 
            "$match" : { 
                "Lvl" : "WING", 
                "Asst" : 0
            }
        }, 
        { 
            "$lookup" : { 
                "from" : "Google", 
                "localField" : "CAPID", 
                "foreignField" : "customSchemas.Member.CAPID", 
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
            "$project" : { 
                "CAPID" : 1, 
                "Duty" : 1, 
                "Asst" : 1, 
                "Director" : "$member.name.fullName", 
                "Email" : "$member.primaryEmail"
            }
        }, 
        { 
            "$sort" : { 
                "Duty" : 1
            }
        }
    ]; 
 
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

function isOnHold( group, email ) {
    // Checks the "GroupHolds" collection for "email" and "group"
    // for a hold to prevent email address removal.
    // email - the email address to check for
    // group - the group email address
    var r = db.getCollection( holdsCollection ).findOne(
	{ email: email, group: group } );
    return r;
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
	var email = m.Email.toLowerCase().replace( / /g, "" );
        if ( ! isActiveMember( m.CAPID ) ) { continue; }
        list.push( m.Email );
        if ( isGroupMember( googleGroup, m.Email ) ) { continue; }
        // Print gam command to add new member
        print("gam update group", googleGroup, "add member", m.Email );
    }
    return list;
}

function removeMembers( collection, pipeline, options, group, authMembers ) {
    // compare each member of the group against the authList
    // check active status, if not generate a gam command to remove member.
    // collection - name of collection holding all Google Group info
    // pipeline - array containing the pipeline to extract members of the target group
    // Check hold status of potential removals
    // options - options for aggregations pipeline
    // group - group to be updated
    // authMembers - set of authorized and possible members

    var m = db.getCollection( collection ).aggregate( pipeline, options );
    while ( m.hasNext() ) {
       	var e = m.next().email.toLowerCase().replace( / /g, "" );
       	var rgx = new RegExp( e, "i" );
       	if ( authMembers.includes( e ) ) { continue; }
	if ( holdsCollection ) {
	    if ( isOnHold( group, e )) {
		print( '#INFO:', e, 'on hold status, not removed.');
		continue;
	    }
	}
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
