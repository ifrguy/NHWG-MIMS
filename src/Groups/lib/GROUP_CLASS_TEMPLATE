// Group: <groupname>
// Purpose: 

// History:
// 12Jul22 MEG domain name can now be passed as an argument.
// 06Jul22 MEG Leaf group classes include a mainline
// 27May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the Google group
const group = '<group>';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = '<mongodb collection name>';

// MongoDB aggregation pipeline to find potential group members.
// The pipeline must result in objects that contain a valid email address
// for candidate members in the attribute named "email"
const memberpipeline = [

    <MongoDB_aggregation_pipeline>

];

class <Class> extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

// Check to see if we're really in full auto mode as opposed to interactive.
// If the environment variable NOAUTORUNGROUP is defined bail out.
if ( process.env.NOAUTORUNGROUP ) { return; }

// If we got here we must be in batch mode, so run the update.
// Instantiate the group object to start everything
let theGroup = new <Class>();
theGroup.updateGroup();
