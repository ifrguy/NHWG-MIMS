// Group: allcadets
//

// History:
// 06Jul22 MEG Group leaf class includes mainline.
// 28May22 MEG Created

// Load my super class definition
load( './lib/Group.js');

// base name of the group
const group = 'allcadets';

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'Member';

// MongoDB aggregation pipeline to find potential members
const memberpipeline = [
    // Stage 1
    {
	$match: {
	    CAPID: { $gt: NumberInt(100000)},
	    Type: 'CADET',
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
	    "Contacts.Type": /^EMAIL/,
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
            "Name" : { 
                "$concat" : [
                    "$NameFirst", 
                    " ", 
                    "$NameLast"
                ]
            },
	    "email": "$Contacts.Contact",
	}
    },

];

// allcadets group 
class AllCadets extends Group {
    constructor( domain = wing_domain, groupname = group, pipeline = memberpipeline,
	         start_agg = pipeline_start ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

// Main

let theGroup = new AllCadets();
theGroup.updateGroup();

