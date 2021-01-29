//MongoDB script to Update the IT Officers group
//The list includes all IT Officers, assistants and Wing Directors.
//
//History:
// 28Jan21 MEG Created.
var DEBUG = false;

var db = db.getSiblingDB( 'NHWG');

// Google Group of interest
var baseGroupName = 'itofficers';
var googleGroup = baseGroupName + '@nhwg.cap.gov';
// Mongo collection that holds all wing groups
var groupsCollection = 'GoogleGroups';

// Aggregation pipeline find all wing staff members as 
var memberPipeline = [
    // Stage 1
    {
	$match: {
	    Duty : /^information.*$|director of it/i,
	    
	}
    },

    // Stage 2
    {
	$lookup: {
	    "from" : "Google",
	    "localField" : "CAPID", 
	    "foreignField" : "customSchemas.Member.CAPID", 
	    "as" : "google"
	}
    },

    // Stage 3
    {
	$unwind: {
	    "path" : "$google", 
	    "preserveNullAndEmptyArrays" : false
	}
    },

    // Stage 4
    {
	$match: {
	    "google.suspended": false,
	}
    },

    // Stage 5
    {
	$project: {
	    "CAPID" : 1,
	    "Name" : "$google.name.fullName", 
	    "Email" : "$google.primaryEmail",    
	    "Duty" : 1, 
	    "Asst" : 1,
	    "Level" : "$Lvl", 
	    "ORGID" : 1,
	}
    },
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

function addMembers( collection, pipeline, options, group ) {
    // Scans  looking for active members
    // if member is not currently on the mailing list generate gam command to add member.
    // returns a list of members qualified to be on the list regardless of inclusion.
    // The set of possible group members.
    // Uses a JS object as a , cheap and dirty set
    var authList = {};

    // Get the list of all qualified potential members for the list
    var cursor = db.getCollection( collection ).aggregate( pipeline, options );
    while ( cursor.hasNext() ) {
        var m = cursor.next();  
        if ( ! isActiveMember( m.CAPID ) ) { continue; }
	if ( ! authList[ m.Email ] ) {  authList[ m.Email ] = true; }
        if ( isGroupMember( googleGroup, m.Email ) ) { continue; }
        // Print gam command to add new member
        print("gam update group", googleGroup, "add member", m.Email );
    }
    return authList;
}

function removeMembers( collection, pipeline, options, group, authMembers ) {
    // compare each member of the group against the authList
    // check active status, if not generate a gam command to remove member.
    // collection - name of collection holding all Google Group info
    // pipeline - array containing the pipeline to extract members of the target group
    // options - options for aggregations pipeline
    // group - group to be updated
    // authMembers - set of authorized and possible members
    var m = db.getCollection( collection ).aggregate( pipeline, options );
    while ( m.hasNext() ) {
       	var e = m.next().email;
       	DEBUG && print("DEBUG::removeMembers::email",e);
       	var rgx = new RegExp( e, "i" );
       	if ( authMembers[ e ] ) { continue; }
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
