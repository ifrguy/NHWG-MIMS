// allparents.js - An ugly brute force script to update the allparents group.
//
// History:
// 15Aug21 MEG Created.
var db = db.getSiblingDB( 'NHWG' );

var DEBUG = true;

// Google Group of interest basename
var baseGroupName = 'allparents';

// FDQN for group email address
var domainName = '@nhwg.cap.gov';

// full email address of Google group
var googleGroup = baseGroupName + domainName 

// Name of the collection to use to find potential members
var memberCollection = 'Member';

// Name of the collection that holds all wing groups
var groupsCollection = 'GoogleGroups';

// Name of collection the contains all the holds
// At a minimum the documents in the hold collection must include two
// attributes:
// email: the email address of the member in the groups to be held.
// group: the email address of the group to which the member belongs
// NOTE: if holdsCollection is "undefined" no check for holds will be executed
var holdsCollection = 'GroupHolds';

// the set of all members in the group
var group = new Set();

// the set of all those authorized to be in the group
var auth = new Set();

// Pipeline - select all valid members, get parent email
var memberPipeline = 	[
		// Stage 1
		{
			$match: {
			    Type:'cadet',
			    MbrStatus:'active'
			    
			}
		},

		// Stage 2
		{
			$lookup: // Equality Match
			{
			    from: "MbrContact",
			    localField: "CAPID",
			    foreignField: "CAPID",
			    as: "mbrcontact"
			}
			
		},

		// Stage 3
		{
			$unwind: {
			    path: "$mbrcontact",
			
			}
		},

		// Stage 4
		{
			$match: {
			    "mbrcontact.Priority": 'PRIMARY',
			    "mbrcontact.Type": 'CADET PARENT EMAIL',
			    
			}
		},

		// Stage 5
		{
			$project: {
			    email: "$mbrcontact.Contact"
			    
			}
		},

		// Stage 6
		{
			$sort: {
			    email:1
			    
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


// Options
var pipelineOptions =  { "allowDiskUse" : false };


function isGroupMember( group, email ) {
    // Check if email is already in the group
//    var email = email.toLowerCase();
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
    var m = '';  // member record pointer
    var e = '';  // member email address
    var cursor = db.getCollection( collection ).aggregate( pipeline, options );
    while ( cursor.hasNext() ) {
        m = cursor.next();
	e = m.email.toLowerCase().replace( / /g, "" ); //clean up
	if ( ! authList[ e ] ) {  authList[ e ] = true; }
	DEBUG && print("DEBUG::addMembers::pushed to auth list:", e );
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
    // Check hold status of potential removals
    // options - options for aggregations pipeline
    // group - group to be updated
    // authMembers - set of authorized and possible members
    var e = '';  // member email address
    var m = db.getCollection( collection ).aggregate( pipeline, options );
    while ( m.hasNext() ) {
       	var e = m.next().email.toLowerCase();
       	DEBUG && print("DEBUG::removeMembers::Checking:", e );
       	var rgx = new RegExp( e, "i" );
       	if ( authMembers[ e ] ) { continue; }
	if ( holdsCollection ) {
	    if ( isOnHold( group, e )) {
		print( '#INFO:', e, 'on hold status, not removed.');
		continue;
	    }
	}
    	DEBUG && print("DEBUG::removeMembers::Delete:", e );
       	print( '#INFO:Removing:', e );
	print( 'gam update group', googleGroup, 'delete member', e );
    }
}

// Main here
print("# Update group:", googleGroup );
print("# Add new members");
var theAuthList = addMembers( memberCollection, memberPipeline,
			      pipelineOptions, googleGroup );

DEBUG == true && print("DEBUG::theAuthList:", theAuthList);

print( "# Remove inactive members") ;
removeMembers( groupsCollection, groupMemberPipeline, pipelineOptions,
	       googleGroup, theAuthList );
