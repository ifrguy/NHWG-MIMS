// Group: allparents

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 28May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'allparents';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'Member';

// MongoDB aggregation pipeline to find potential members
const memberpipeline = [
    // Stage 1
    {
	$match: {
	    Type:'CADET',
	    MbrStatus: { $ne: 'EXMEMBER' },
	    NHWGStatus: { $ne: 'DROP' },
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
    // MANDATORY FIELDS: CAPID, email, Name
    {
	$project: {
	    CAPID: 1,
            "Name" : { 
                "$concat" : [
                    "$NameFirst", 
                    " ", 
                    "$NameLast",
		    " ",
		    "$NameSuffix",
                ]
            },
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

// allparents group 
class AllParents extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new AllParents();
theGroup.updateGroup();

