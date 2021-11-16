//MongoDB JS script to update a wing Safety Officers group

// History:
// 26Feb21 MEG Exclude group OWNERs from removal.
// 25Feb21 MEG Created.

var DEBUG = false;

var db = db.getSiblingDB( 'NHWG');

// Google Group of interest basename
var baseGroupName = 'safetyofficers';
// FDQN for group email address
var domainName = '@nhwg.cap.gov';

// full email address of Google group
var googleGroup = baseGroupName + domainName ;

// Name of the collection to use to find potential members
var memberCollection = 'DutyPosition';

// Name of the collection that holds all wing groups
var groupsCollection = 'GoogleGroups';


// Aggregation pipeline (join) to select potentional members for
// Safety Officers group.

var memberPipeline = 	[
    // Stage 1
    {
	$match: {
	    // enter query here
	    Duty: /safety/i,
	}
    },

    // Stage 2
    {
	$lookup: // Equality Match
	{
	    from: "Google",
	    localField: "CAPID",
	    foreignField: "customSchemas.Member.CAPID",
	    as: "google"
	}
	
	// Uncorrelated Subqueries
	// (supported as of MongoDB 3.6)
	// {
	//    from: "<collection to join>",
	//    let: { <var_1>: <expression>, …, <var_n>: <expression> },
	//    pipeline: [ <pipeline to execute on the collection to join> ],
	//    as: "<output array field>"
	// }
    },

    // Stage 3
    {
	$unwind: {
	    path: "$google",
	    preserveNullAndEmptyArrays: false, // optional
	}
    },

    // Stage 4
    {
	$project: {
	    // specifications
	    CAPID:1,
	    Asst: 1,
	    Duty: 1,
	    Name: "$google.name.fullName",
	    Email: "$google.primaryEmail",
	    Unit: "$google.orgUnitPath",
	}
    },
];

// Aggregate a list of all emails for the Google group of interest
// Exlcuding OWNER roles, no group aristocrats are considered.
// Owners must be managed manually.

var groupMemberPipeline =
    [
        { 
            "$match" : {
                "group" : googleGroup,
		        "role" : /(MEMBER|MANAGER)/,
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
    var email = email.toLowerCase().replace( / /g, "" );
    var rx = new RegExp( email, 'i' );
    return db.getCollection( groupsCollection ).findOne( { 'group': group, 'email': rx } );
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
	var email = m.Email.toLowerCase().replace( / /g, "" );
        if ( ! isActiveMember( m.CAPID ) ) { continue; }
	if ( ! authList[ email ] ) {  authList[ email ] = true; }
        if ( isGroupMember( googleGroup, email ) ) { continue; }
        // Print gam command to add new member
        print("gam update group", googleGroup, "add member", email );
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
       	var e = m.next().email.toLowerCase().replace( / /g, "" );
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
var theAuthList = addMembers( memberCollection, memberPipeline, options, googleGroup );

DEBUG == true && print("DEBUG::theAuthList:", theAuthList);

print( "# Remove inactive members") ;
removeMembers( groupsCollection, groupMemberPipeline, options, googleGroup, theAuthList );
