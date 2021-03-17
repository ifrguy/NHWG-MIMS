//MongoDB template script to update a wing group
//This is a template JS script for MongoDB you must adapt it for your group
// 1. Supply an aggregation pipeline for 'memberPipeline' to provide
//    a list of member candidates for your group
//    The following fields are MANDATORY, others as desired
//
//    CAPID - Members CAPID
//    Email - the members wing account primaryEmail address
//    (see memberPipeline template below as a guide)
//
// 2. Fill in values for the following variables:
//    baseGroupName - the base name for the group email address
//    domainName - FQDN for the group the default is "nhwg.cap.gov"
//    memberCollection - name of the collect to use to find potential group members
//    groupsCollection - name of the collection housing all wing groups
//                       the default is the collection 'GoogleGroups'
//    holdsCollection  - (OPTIONAL) name of collection that contains emails
//                       to withhold from removal.
//                       If null or not defined hold checking is skipped.
//
// 3. Once completed you can test the script by passing it as a command line
//    arguement to the updateGroup bash shell script. If the result is what
//    you expect then you may add a crontab job to mims crontab
//
//History:
// 17Mar21 MEG Minor header documentation changes for clarity.
// 16Mar21 MEG Added isOnHold to check for addresses not to be removed.
// 25Feb21 MEG Added explanatory text, cleaned up variables.
// 28Jan21 MEG Created.

var DEBUG = false;

var db = db.getSiblingDB( 'NHWG');

// Google Group of interest basename
var baseGroupName = '';

// FDQN for group email address
var domainName = '@nhwg.cap.gov';

// full email address of Google group
var googleGroup = baseGroupName + domainName 

// Name of the collection to use to find potential members
var memberCollection = '';

// Name of the collection that holds all wing groups
var groupsCollection = 'GoogleGroups';
// Name of collection the contains all the holds
// At a minimum the documents in the hold collection must include two
// attributes:
// email: the email address of the member in the groups to be held.
// group: the email address of the group to which the member belongs
// NOTE: if holdsCollection is "undefined" no check for holds will be executed
var holdsCollection = 'GroupHolds';

// Aggregation template pipeline used to find qualified members.
// This is an arrary of MongoDB aggregation operations to be applied
// to the collection containing potential members for the group.  Usually
// DutyPositions, or MbrAchievements, your mileage may vary.
// You may replace this template pipeline with your own, but remember you must
// at minimum project the members CAPID and Email (Google primaryEmail).

var memberPipeline = [
    // Stage 1
    {
	$match: {
	    // add selection fields as needed to choose potential members
	    // field: selection value or expression,
	    // field1:selection value or expression,...
	    
	}
    },

    // Stage 2 - Lookup the member in the Google collection
    {
	$lookup: {
	    "from" : "Google",
	    "localField" : "CAPID", 
	    "foreignField" : "customSchemas.Member.CAPID", 
	    "as" : "google"
	}
    },

    // Stage 3 - flatten the google array for easy of access
    {
	$unwind: {
	    "path" : "$google", 
	    "preserveNullAndEmptyArrays" : false
	}
    },

    // Stage 4 - only consider active accounts
    {
	$match: {
	    "google.suspended": false,
	}
    },

    // Stage 5 - project the final member record for futher processing
    //           The listed fields are MANDATORY
    {
	$project: {
	    "CAPID" : 1,
	    "Name" : "$google.name.fullName", 
	    "email" : "$google.primaryEmail",    
	    // you may add other fields here
	}
    },
];

// Aggregate a list of all emails for the Google group of interest
// Exlcuding MANAGER & OWNER roles, no group aristocrats are considered.
// Managers and Owners must be managed manually.

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
    // Scans  looking for potential members based on pipeline selection.
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
	if ( ! authList[ m.email ] ) {  authList[ m.email ] = true; }
        if ( isGroupMember( googleGroup, m.email ) ) { continue; }
        // Print gam command to add new member
        print("gam update group", googleGroup, "add member", m.email );
    }
    return authList;
}

function removeMembers( collection, pipeline, options, group, authMembers ) {
    // compare each member of the group against the authList
    // check active status, if not generate a gam command to remove member.
    // collection - name of collection holding all Google Group info
    // pipeline - array containing the pipeline to extract members of the target group
    // Check hold status for potential removals
    // options - options for aggregations pipeline
    // group - group to be updated
    // authMembers - set of authorized and possible members
    var m = db.getCollection( collection ).aggregate( pipeline, options );
    while ( m.hasNext() ) {
       	var e = m.next().email;
       	DEBUG && print("DEBUG::removeMembers::email",e);
       	var rgx = new RegExp( e, "i" );
       	if ( authMembers[ e ] ) { continue; }
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
var theAuthList = addMembers( memberCollection, memberPipeline, options, googleGroup );

DEBUG == true && print("DEBUG::theAuthList:", theAuthList);

print( "# Remove inactive members") ;
removeMembers( groupsCollection, groupMemberPipeline, options, googleGroup, theAuthList );
