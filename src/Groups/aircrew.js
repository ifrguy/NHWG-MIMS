// aircrew.js:  Updates the aircrew group.  Add newly qualified members, removes
// members no longer qualified.  Execptions registered in the
// "GroupHolds" collection will not be removed regardless of member status.
//
// History:
// 20Dec21 MEG Fixed bug, didn't consider managers as members when adding new.
// 16Mar21 MEG Ported to new group update template.

var DEBUG = false;

var db = db.getSiblingDB( 'NHWG');

// Google Group of interest basename
var baseGroupName = 'aircrew';

// FDQN for group email address
var domainName = '@nhwg.cap.gov';

// full email address of Google group
var googleGroup = baseGroupName + domainName 

// Name of the collection to use to find potential members
var memberCollection = 'MbrAchievements';

// Name of the collection that holds all wing groups
var groupsCollection = 'GoogleGroups';
// Name of collection the contains all the holds
var holdsCollection = 'GroupHolds';

// Aggregation (join) pipeline to select aircrew members
var memberPipeline =     [
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
    var email = email.toLowerCase().replace( / /g, "" );
    var rx = new RegExp( email, 'i' );
    return db.getCollection( groupsCollection ).findOne( { 'group': group,
							   'email': rx } );
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
	if ( isOnHold( group, e )) {
	    print( '#INFO:', e, 'on hold status, not removed.');
	    continue;
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
