// Group: nh-wing-directors@nhwg.cap.gov
// Purpose: Wing Directors, no assistants

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 29May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'nh-wing-directors';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'DutyPosition';

// MongoDB aggregation pipeline to find potential group members.
// The pipeline must result in objects that contain a valid email address
// for candidate members in the attribute named "email"
// Select only directors, no assistants
const memberpipeline = [
    {
	$match: {
	    Duty:/director/i,
	    Asst: 0,
	}
    },

    {
	$lookup: // join Google account record
	{
	    from: "Google",
	    localField: "CAPID",
	    foreignField: "customSchemas.Member.CAPID",
	    as: "google"
	}

    },

    {
	$lookup: // join Member
	{
	    from: "Member",
	    localField: "CAPID",
	    foreignField: "CAPID",
	    as: "member"
	}

    },

    {
	// flatten array
	$unwind: {
	    path : "$member",
	    preserveNullAndEmptyArrays : false // optional
	}
    },

    {
	$match: {
	   "member.MbrStatus" : "ACTIVE",
	}
    },

    {
	// flatten array
	$unwind: {
	    path : "$google",
	    preserveNullAndEmptyArrays : false // optional
	}
    },

    {
	$project: {
	    CAPID:1,
	    Duty:1,
	    Asst:1,
	    Name: "$google.name.fullName",
	    email: "$google.primaryEmail",
	}
    },
];

// WingDirectors group
class WingDirectors extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new WingDirectors();
theGroup.updateGroup();



