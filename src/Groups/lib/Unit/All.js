load('./lib/Group.js');

// DEPRECATED - ADMINS SHOULD SIMPLY CREATE THE "all" GROUP AND THEN
// ADD THE GROUPS: cadets, parents, seniors AS MEMBERS AFTER THOSE
// GROUPS ARE CREATED.

// Updates a unit's "all" group.  The "all" group consists of all active
// cadet and senior members.

// History:
// 02May23 MEG DEPRECATED

var pipeline = 
    []; 

// unit charter number as a string must be supplied by --eval or other means
var unit_domain = unit + "." + wing_domain;

class All extends Group {
    constructor( domain, groupname, pipeline, start_agg ) {
	super( domain, groupname, pipeline, start_agg );
    }
    updateGroup() {
	print( "### DEPRECATED ###" );
	print( "### Admins simply add the units cadets, parents and seniors groups as members to:", myGroup() );
    }
    addMembers() {
	return;
    }
    removeMembers() {
	return;
    }
}

var theGroup = new All( unit_domain,
			    'all',
			    pipeline, "Member" );
theGroup.updateGroup();
