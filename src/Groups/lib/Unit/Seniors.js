load('./lib/Group.js');

var pipeline = 
    [
        {
            "$match" : {
                "Type" : "SENIOR",
                "MbrStatus" : "ACTIVE",
                "Unit" : unit,      // variable
            }
        }, 
        {
            "$sort" : {
                "CAPID" : 1
            }
        }, 
        {
            "$lookup" : {
                "from" : "MbrContact",
                "localField" : "CAPID",
                "foreignField" : "CAPID",
                "as" : "contacts"
            }
        }, 
        {
            "$unwind" : {
                "path" : "$contacts"
            }
        }, 
        {
            "$match" : {
                "contacts.Type" : "EMAIL",
                "contacts.Priority" : "PRIMARY"
            }
        }, 
        {
            "$project" : {
                "CAPID" : 1,
                "Unit" : 1,
                "Type" : 1,
		"Name": { $concat: [ "$NameFirst", " ", "$NameLast" ]},
                "email" : "$contacts.Contact"
            }
        }
    ]; 

var AggOptions =
    {
        "allowDiskUse" : false
    };

// unit charter number as a string must be supplied by --eval or other means
var unit_domain = unit + "." + wing_domain;

class Seniors extends Group {
    constructor( domain, groupname, pipeline, start_agg ) {
	super( domain, groupname, pipeline, start_agg );
    }
}

var theGroup = new Seniors( unit_domain,
			    'seniors',
			    pipeline, "Member" );
theGroup.updateGroup();

