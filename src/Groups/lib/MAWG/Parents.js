// Parents of cadets group

// Load my super class definition
import { Group } from '../Group.js';
import { config } from "../../../getConfig.js";

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'Member';

// MongoDB aggregation pipeline to find potential group members
function makePipeline(unit, domain, groupname)
{
  var pipeline =
      [
        {
          "$match" :
          {
            "Type" : "CADET",
            "MbrStatus" : "ACTIVE",
            "Unit" : unit,
          }
        },
        {
          "$lookup" :
          {
            "from" : "MbrContact",
            "localField" : "CAPID",
            "foreignField" : "CAPID",
            "as" : "contact"
          }
        },
        {
          "$unwind" :
          {
            "path" : "$contact"
          }
        },
        {
          "$match" :
          {
            "contact.Type" : "CADET PARENT EMAIL",
            // "contact.Priority" : "PRIMARY",
		    "contact.DoNotContact" : false,
          }
        },
        {
          "$project" :
          {
            "CAPID" : 1,
		    "Name": { $concat: [ "$NameFirst", " ", "$NameLast" ]},
            "email" : "$contact.Contact",
          }
        }
      ];

  return pipeline;
}

export default class extends Group
{
  constructor(db, groupname, unit = "")
  {
    const pipeline = makePipeline(unit, config.domain, groupname);

	super( db, config.domain, groupname, pipeline, pipeline_start );
  }
}
