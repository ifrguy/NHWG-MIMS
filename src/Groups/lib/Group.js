// Group Class
// Copyright 2026 Marshall E. Giguere
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       https://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.


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
// 20Jun26 MEG Fixed query arg error in #isReserveUnitMember().
// 06Jun26 MEG Check if Unit 000 members allow in groups
// 04Jan26 MEG Change add to make sure email addresses are cleaner.
// 26Sep25 MEG Added "allowUnit000MembersInGroup switch to control whether to
// include or exclude reserve unit (000) members from groups.
// 06Sep25 MEG Added additional DEBUG usage info below.
// 28Sep24 MEG Selection $expr selecting GROUP types, it shouldn't
// 27Sep24 MEG Change REGEX in group selection to simple test for speed.
// 26Sep24 MEG Fixed bug where non-NHWG emails were ignored for removal.
// 22Feb24 MEG Clean-up debug output.
// 30Apr23 MEG Group.cleanEmailAddress - fixed replace() regex pattern.
// 15Apr23 MEG Ignore members that are "groups".
// 18Nov22 MEG addMembers() adding duplicates if member listed more than once.
// 12Jul22 MEG Domain name can now be passed as arg to constructor.
// 10Jul22 MEG updateGroup() added, default procedure for updating a group.
// 07Jun22 MEG isGroupMember() not ignoring case when searching group.
// 26May22 MEG Debugged into existence.
// 22Dec21 MEG Created.

// Debug output may be produced by including 'DEBUG=true;'
// at the tail of command line.

load( './lib/config.js' );
print( "Reserve flage:", ALLOW_RESERVE_UNIT_GROUP_MEMBERS);
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
    // Unit 000 (reserve unit) are not allowed to participate in missions or
    // be on staff.
    // Subclasses may set this to true if they wish to permit 000 members in
    // groups.

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
		    // Only select USER & OTHER member types
		    $expr: { $or: [ { $eq: [ "$type", "USER"] }, { $eq: [ "$type", "OTHER" ] } ] },
//  Marginally slower using REGEX
//		    "type" : /(USER|OTHER)/,
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
	var m = db.getCollection( "Member").findOne( { "CAPID": capid, "MbrStatus": "ACTIVE" } );
	return ( m ) ? true : false;
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

    #isReserveUnitMember( capid ) {
	// Checks for reserved unit (000) membership.
	// Return true if the member is in unit 000
	// non-participating members.
	DEBUG &&
	    print("CALLED: isReservedUnitMember, with CAPID:", capid, "DB: ", db );
	let m = db.getCollection( "Member" ).findOne( { "CAPID": capid } );
	let ret =( m.Unit == '000' ) ? true : false;
	DEBUG &&
	    print( "CAPID:", capid, "Name:", m.NameFirst + " " + m.NameLast, " Unit:", m.Unit );
	return ret;
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
	const rex = /[,; ]/g;
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
	    DEBUG && print( "m.email: ", m.email, " CAPID: ", m.CAPID );
	    let e = this.cleanEmailAddress( m.email );
	    // Force clean email address to record to get rid of spurious
	    // spaces inserted by eServices.
	    m.email = e;
            if ( ! this.#isActiveMember( m.CAPID ) ) { continue; }
	    // Check if reserve unit members are allowed in groups
	    if ( this.#isReserveUnitMember( m.CAPID ) && 
		ALLOW_RESERVE_UNIT_GROUP_MEMBERS == false ) { continue; }
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
	    print( "AuthList: ", Object.getOwnPropertyNames( this.AuthList ) );
	    print( "Group:", this.myGroup );
	    print( this.name + ':' + 'called removeMembers():' );
	}
	print( "## Remove group members." );
	var m = db.getCollection( "GoogleGroups" ).aggregate( this.#groupMemberPipeline,
								    this.#agg_options );
	while ( m.hasNext() ) {
       	    var e = this.cleanEmailAddress( m.next().email );
       	    DEBUG && print( this.name + "::removeMembers:called with email:",e);
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
