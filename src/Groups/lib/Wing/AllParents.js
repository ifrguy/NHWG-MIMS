// Group: allparents

// History:
// 08Sep23 MEG Skip record if "DoNotContact" is true.
// 03Apr23 MEG Project DoNotContact
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
	    as: "contact"
	}
	
    },

    // Stage 3
    {
	$unwind: {
	    path: "$contact",
	    
	}
    },

    // Stage 4
    {
	$match: {
	    "contact.Priority": 'PRIMARY',
	    "contact.Type": 'CADET PARENT EMAIL',
	    "contact.DoNotContact" : false,
	}
    },

    // Stage 5
    // MANDATORY FIELDS: CAPID, email, Name, DoNotContact
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
	    email: "$contact.Contact",
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

