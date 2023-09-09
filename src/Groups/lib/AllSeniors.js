// Group: allseniors
// This group contains all senior member email addresses based on
// eServices PRIMARY EMAIL.

// History:
// 08Sep23 MEG Skip record if "DoNotContact" is true.
// 03Apr23 MEG Project DoNotContact
// 06Jul22 MEG Group leaf class includes mainline.
// 28May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'allseniors';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'Member';

// MongoDB aggregation pipeline to find potential members
const memberpipeline = [
    // Stage 1
    {
	$match: {
	    CAPID: { $gt: NumberInt(100000)},
	    Type: 'SENIOR',
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
	    as: "contact"
	}
	
    },

    // Stage 3
    {
	$unwind: {
	    path : "$contact",
	    preserveNullAndEmptyArrays : false
	}
    },

    // Stage 4
    {
	$match: {
	    "contact.Priority": "PRIMARY",
	    "contact.Type": /^EMAIL/,
	    "contact.DoNotContact" : false,
	}
    },

    // Stage 5
    // MANDATORY FIELDS: CAPID, email, Name
    {
	$project: {
	    // specifications
	    CAPID:1,
            "Name" : { 
                "$concat" : [
                    "$NameFirst", 
                    " ", 
                    "$NameLast",
		    " ",
		    "$NameSuffix",
                ]
            },
	    "email": "$contact.Contact",
	}
    },
];

// allseniors group
class AllSeniors extends Group {
    constructor( domain = wing_domain, groupname = group,
		 pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new AllSeniors();
theGroup.updateGroup();

