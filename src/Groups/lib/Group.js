// Group Class
// Each subclass group must define:
// const group = <theGroupName>  The name of the Google group
// const memberpipeline = [] an array containing the MongoDB aggregation
//       pipeline used to return potential members.  The pipeline must at
//       minimum produce the field "email" containing the members email address.
// Subclasses may override methods as needed.
//
// Compatibility:
// ECMAScript >=6
// MongoDB >4.2
// MongoShell(mongosh) >1.1.7

// History:
// 22Feb24 MEG Clean-up debug output.
// 30Apr23 MEG Group.cleanEmailAddress - fixed replace() regex pattern.
// 15Apr23 MEG Ignore members that are "groups".
// 18Nov22 MEG addMembers() adding duplicates if member listed more than once.
// 12Jul22 MEG Domain name can now be passed as arg to constructor.
// 10Jul22 MEG updateGroup() added, default procedure for updating a group.
// 07Jun22 MEG isGroupMember() not ignoring case when searching group.
// 26May22 MEG Debugged into existence.
// 22Dec21 MEG Created.

//const db = db.getSiblingDB("NHWG");

try {
	if ( DEBUG ) {}
}
catch( exp ) {
	if ( exp instanceof ReferenceError ) {
		var DEBUG = false;
	}
	else {
		throw exp;
	}
}

// Assert debugging function
const Assert = function( conditionalExpression, errorMessage ) {
	if ( ! conditionalExpression ) {
		throw new Error( 'ASSERT FAILED: ' + ( 
			errorMessage || '' ))
	}
}

//Base FQDN
const wing_domain = 'nhwg.cap.gov';
// MongoDB collection that contains members on hold status
const holdsCollection = 'GroupHolds';
// MongoDB collection holding all groups & members
const groupsCollectioName = 'GoogleGroups';

// Group base class
class Group {
    // Private:
    #_myName;
    #authList;
    #myDomain;
    #group;
    // Aggregation pipeline to find candidate members for group,
    // supplied by subclasses
    #pipeline = undefined;
    // Name of the collection where the pipeline begins processing,
    // supplied by subclass
    #aggStart;
    // Group member agg pipeline
    #groupMemberPipeline;
    // Aggregation pipeline options
    #agg_options =  { "allowDiskUse" : false };

    dump() {
	print( "DB: " + db.getName(),
	       "\nGroup: " + this.myGroup,
	       "\nDomain:", this.#myDomain,
	       "\n#pipeline:",this.#pipeline,
	       "\n#aggStart: " + this.#aggStart,
	       "\n#authList:", this.#authList );
    }
    constructor( domain, name, pipeline, agg_start ) {
	this.#_myName = name;
	this.#myDomain = domain;
	this.#authList = {}; //uses a JS object as a cheap associative set
	this.#group = name + '@' + domain;
	this.#pipeline = pipeline;
	this.#aggStart = agg_start;
	// Ignores managers and groups
	this.#groupMemberPipeline = [
            { 
		"$match" : {
                    "group" : this.#group,
		    "role" : 'MEMBER',
		    "type" : 'USER',
		}
            }, 
            { 
		"$project" : {
		    "email" : "$email",
		    "type" : "$type",
		}
            }
	];
    };

    // Private methods
    #isActiveMember( capid ) {
	// Check to see if member is active.
	// This function needs to be changed for each group depending
	// on what constitutes "active".
	var m = db.getCollection( "Member").findOne( { "CAPID": capid, "MbrStatus": "ACTIVE" } );
	return ( m == null )? false : true;
    }

    #isAuth( email ) {
	// Check if the member is in the auth List
	DEBUG && print( this.name + ':' + 'called isAuth():' + email );
	return ( this.#authList[ email ])?  true : false;
    }

    #isGroupMember( email ) {
	// Check if email is already in the group
	DEBUG && print( this.name + ':' + 'called isGroupMember():' + email );
	let regx = new RegExp( email, 'i' );
	var r = db.getCollection( "GoogleGroups" ).findOne( { 'group': this.myGroup, 'email': regx } );
	DEBUG && print( "email:", email, "is group member:", r );
	return ( r == null) ? false : email;

    }

    #isOnHold( email ) {
	// Checks the "GroupHolds" collection for "email" and "group"
	// for a hold to prevent email address removal.
	// email - the email address to check for
	DEBUG && print( this.name + ':' + 'called isOnHold():' + email );
	let r = db.getCollection( "GroupHolds" ).findOne(
	    { email: email, group: this.myGroup } );
	return r;
    }

    // Public methods
    get domain() {
	return this.#myDomain;
    }
    get name() {
	return this.#_myName;
    }

    cleanEmailAddress( email ) {
	// Change all chars to lowercase and remove offensive chars.
	// all email addresses are assumed to but UTF-8 charset.

	// rex - illegal characters to remove from email address
	const rex = /[\,\;\ ]/g;
	Assert( email, this.name + ":cleanEmailAddress: invalid email" );
	let e = email.toLowerCase();
	e = e.replace( rex, "" );
	return e;
    }
    
    get myGroup() {
	return this.#group;
    }
    get AuthList() {
	return this.#authList;
    }
    
    get pipeline() {
	return this.#pipeline;
    }
    
    addMembers() {
	// Scans  looking for potential members based on selection pipeline.
	// if member is not currently on the mailing list generate
	// gam command to add member.
	// Creates a set {}, #authList, of members qualified to be on the list.
	// The set #authList contains all of the data returned by the
	// aggregation pipeline for each member.
	// Uses a JS object as a , cheap and dirty set.

	Assert( this.#pipeline, this.name + "::addMembers: Find candidate members pipeline undefined." )
	if ( DEBUG ) { print("Group::addMembers"); 
		       print("DB:", db );
		       print( "Group:", this.myGroup );
		       print( this.name + ':' + 'called addMembers():' );
	}
	let count = 0;
	print( "## Add group members." );
	// Get the list of all qualified potential members for the list
	var cursor = db.getCollection( this.#aggStart ).aggregate( this.#pipeline, this.#agg_options );
	while ( cursor.hasNext() ) {
            var m = cursor.next();  
	    let e = this.cleanEmailAddress( m.email );
            if ( ! this.#isActiveMember( m.CAPID ) ) { continue; }
	    // if already in the auth list skip we've done them previously
	    // if member is not in auth list add them and issue group add
	    // this is to handle duplicates from queries.
	    if ( this.#isAuth( e )) { continue; }
	    // haven't seen you before add to auth and group
	    this.#authList[ e ] = m;
	    if ( DEBUG ) { print( "Added to authList:", e ); }

	    if ( this.#isGroupMember( e ) ) { continue; }
	    // Print gam command to add new member
	    if (DEBUG) { print( "returned from #isGroupMember()" ); }
	    print( "# Associated CAPID:", m.CAPID );
	    print("gam update group", this.myGroup, "add member", e );
	    count++;
	}
	print( "## Added:", count, "members." );
    }

    removeMembers() {
	// compare each member of the group against the authList,
	// if not generate a gam command to remove member.
	// Check hold status for potential removals.
	// group - group to be updated
	// authList - set of authorized and possible members
	// NOTES:
	// 1. TEMPORAL ORDERING IS IMPORTANT!  "addMembers() must be run prior
	//    to "removeMembers() in order to set the authList.
	// 2. All email addresses must be cleansed prior to use, no uppercase,
	//    no spaces.

	let count = 0;
	if ( DEBUG ) {
		print( "Group::removeMembers" );
		print( "Group:", this.myGroup );
		print( this.name + ':' + 'called removeMembers():' );
	}
	print( "## Remove group members." );
	var m = db.getCollection( "GoogleGroups" ).aggregate( this.#groupMemberPipeline,
								    this.#agg_options );
	while ( m.hasNext() ) {
       	    var e = this.cleanEmailAddress( m.next().email );
       	    DEBUG && print( this.name + "::removeMembers::email",e);
       	    if ( this.#isAuth( e )) { continue; }
	    if ( this.#isOnHold( e )) {
		print( '# INFO:', e, 'on hold status, not removed.');
		continue;
	    }
	    DEBUG && print("Member to be removed:", e );
       	    print( '# INFO:Remove:', e );
            print( 'gam update group', this.myGroup, 'delete member', e );
	    count++;
	}
	print( "## Removed:", count, "members." );
    };
    updateGroup() {
	// Default update procedure
	// Maybe overridden by subclass
	// if NOAUTORUNGROUP is defined do not run the update, we must not
	// be in batch mode.
	if ( process.env.NOAUTORUNGROUP ) {
	    print( "NOAUTORUNGROUP: enabled, returning without running." );
	    return; }
	DEBUG && print("DB:", db.getName());
	print( "# Update: " + this.myGroup + " Group" );
	this.addMembers();
	this.removeMembers();
    }
}
