// Group: newbie
// The newbie group is for new members.  Members are removed after ninty days.
// Members are automatically added to the group upon account creation,
// nothing to do here.


// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 28May22 MEG Created

// Load my super class definition
load( './lib/Group.js');
// load date arithmetic functions
load( db.ENV.findOne( { name: 'DATEFNS' } ).value );

//how many days members may stay in the newbie list
const RETENTION = 90;

// base name of the group
const group = 'newbie';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = undefined;

// MongoDB aggregation pipeline to find potential members
const memberpipeline = undefined;

// newbie group
class Newbie extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }

    addMembers() {
	// Members are automatically added at account creation time.
	DEBUG && print( "Newbie:addMembers(): does nothing, overrides Group method." ); 
	return true;
    }

    removeMembers() {
	// Find all members who have been in the newbie group more that the retention days
	let today = new Date();  //date today
	// members on the list earlier that this date will be removed
	let lookback = dateFns.subDays( today, RETENTION );


	DEBUG && print( "Newbie:removeMembers()" );
	print( "## Remove group members." );
	let count = 0;
	let cursor = db.getCollection("GoogleGroups").find({ group: this.myGroup,
							     role: 'MEMBER',
							     createTime: { $lte: lookback }});
	while ( cursor.hasNext() ) {
	    let m = cursor.next();
	    print( "gam update group", this.myGroup, "delete member", m.email );
	    count++;
	}
	print( "## Removed:", count, "members." );
    }
}

// Main

let theGroup = new Newbie();
theGroup.updateGroup();


