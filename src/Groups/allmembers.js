// MongoDB script to Update all members of the specified group.
//
// Must be run from the mongo shell using the --eval option to
// set the var's: GroupName and memberType
// Acceptable values:
// GroupName: allsenoirs | allcadets
//History:
// 16Aug21 MEG Ingore spaces in email addresses.
// 11Aug21 MEG Accepts globals for group and member type
// 18Nov19 MEG Change temporal ordering of add and remove to fix Google issue.
// 19Aug19 MEG Created.

var db = db.getSiblingDB( 'NHWG');

// Here's where we process "agr's" that are passed in as variable
// declarations using --eval on the mongo command line.

// Member type of interest
var memberType = '';

switch( GroupName ) {
   case 'allseniors':
        memberType = 'SENIOR';
        break;
   case 'allcadets':
        memberType = 'CADET';
        break;
}

// FDQN for the domain
var domain = '@nhwg.cap.gov';

// Google Group to process, group email address
var googleGroup = GroupName + domain;

// Collection that contains all wing groups
var groupsCollection = 'GoogleGroups';

// Collection containing members on hold status to prevent removal
var holdsCollection = 'GroupHolds';

// import date math functions
load( db.ENV.findOne( {name:'DATEFNS'} ).value );
// look past 30 days expired members after this remove member from group.
var lookbackdate = dateFns.subDays( new Date(), 30 );
// Aggregation pipeline find all ACTIVE members PRIMARY EMAIL addresses.
var memberPipeline = 
	// Pipeline
	[
		// Stage 1
		{
			$match: {
			    CAPID: { $gt: NumberInt(100000)},
			    Type: memberType,
			    MbrStatus:"ACTIVE",
			}
		},

		// Stage 2
		{
			$lookup: // Equality Match
			{
			    from: "MbrContact",
			    localField: "CAPID",
			    foreignField: "CAPID",
			    as: "Contacts"
			}
			
		},

		// Stage 3
		{
			$unwind: {
			    path : "$Contacts",
			    preserveNullAndEmptyArrays : false
			}
		},

		// Stage 4
		{
			$match: {
			    "Contacts.Priority": "PRIMARY",
			    "Contacts.Type": "EMAIL",
			}
		},

		// Stage 5
		{
			$unwind: {
			    path : "$Contacts",
			    preserveNullAndEmptyArrays : false
			}
		},

		// Stage 6
		{
			$project: {
			    // specifications
			    CAPID:1,
			    NameLast:1,
			    NameFirst:1,
			    NameSuffix:1,
			    "email": "$Contacts.Contact",
			    
			}
		},
	];


// Aggregate a list of all MEMBERS for the Google group of interest
// Ignore managers and owners
var groupMemberPipeline =
    [
        { 
            "$match" : {
                "group" : googleGroup,
		"role" : 'MEMBER'
            }
        }, 
        { 
            "$project" : {
                "Email" : "$email"
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

function isOnHold( group, email ) {
    // Checks the "GroupHolds" collection for "email" and "group"
    // for a hold to prevent email address removal.
    // email - the email address to check for
    // group - the group email address
    var r = db.getCollection( holdsCollection ).findOne(
	{ email: email, group: group } );
    return r;
}

function isGroupMember( group, email ) {
    // Check if email is already in the group
    var email = email.toLowerCase().replace( / /g, "" );
    var rx = new RegExp( email, 'i' );
    return db.getCollection( groupsCollection ).findOne( { 'group': group, 'email': rx } );
}

function addMembers( collection, pipeline, options, group ) {
    // Scans  looking for active members
    // if member is not currently on the mailing list generate gam command to add member.
    var cursor = db.getCollection( collection ).aggregate( pipeline, options );
    while ( cursor.hasNext() ) {
        var m = cursor.next();
	var email = m.email.toLowerCase().replace( / /g, "" );
        if ( ! isActiveMember( m.CAPID ) ) { continue; }
        if ( isGroupMember( googleGroup, email ) ) { continue; }
        // Print gam command to add new member
        print("gam update group", googleGroup, "add member", email );
    } 
}

function removeMembers( collection, pipeline, options, group ) {
    // for each member of the group
    // check active status, if not generate a gam command to remove member.
    var m = db.getCollection( collection ).aggregate( pipeline, options );
    while ( m.hasNext() ) {
       	var e = m.next().Email.toLowerCase().replace( / /g, "" );
       	var rgx = new RegExp( e, "i" );
	if ( isOnHold( googleGroup, e ) ) {
	    print( '#INFO:', e, 'on hold status, not removed.');
	    continue;
	}
       	var r = db.getCollection( 'MbrContact' ).findOne( { Type: 'EMAIL', Priority: 'PRIMARY', Contact: rgx } );
       	if ( r ) {
    	    var a = db.getCollection( 'Member' ).findOne( { CAPID: r.CAPID, Type: memberType } );
    	    if ( a == null || isActiveMember( r.CAPID ) ) { continue; }
       	    if ( a.Expiration < lookbackdate ) {
       		print( '#INFO:', a.CAPID, a.NameLast, a.NameFirst, a.NameSuffix, 'Expiration:', a.Expiration );
       	    	print( 'gam update group', googleGroup, 'delete member', e );
       	    }
    	}
    	else {
       	    print( '#INFO: Unknown email:', e, 'removed' );
       	    print( 'gam update group', googleGroup, 'delete member', e );
    	}
    	    
    }
}


// Main here
// Do NOT change the temporal order of remove and add operations.
// Google plays games with "." in user id's
print("# Update group:", googleGroup );
print( "# Remove inactive members") ;
removeMembers( groupsCollection, groupMemberPipeline, options, googleGroup );
print("# Add new members");
addMembers( "Member", memberPipeline, options, googleGroup );
