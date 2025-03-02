// Seniors
//
// History:
// 01Mar25 DJL Initial version, derived from NHWG classes
//

// Load my super class definition
import { Group } from '../Group.js';
import { config } from "../../../getConfig.js";

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'Member';

// MongoDB aggregation pipeline to find potential group members
function makePipeline(unit, domain, groupname)
{
  // MongoDB aggregation pipeline to find potential members
  let pipeline;
  
  if (unit)
  {
    pipeline = [
      {
	    $match : {
	      CAPID     : { $gte : 100000 },
	      Type      : "SENIOR",
	      MbrStatus : "ACTIVE",
          Unit      : unit
	    }
      }
    ];
  }
  else
  {
    pipeline = [
      {
	    $match : {
	      CAPID     : { $gte : 100000 },
	      Type      : "SENIOR",
	      MbrStatus : "ACTIVE",
	    }
      }
    ];
  }
  
  pipeline = pipeline.concat(
    [
      {
	    $lookup:
        {
	      "from" : "Google",
	      "localField" : "CAPID", 
	      "foreignField" : "customSchemas.Member.CAPID", 
	      "as" : "google"
	    }
      },
      {
	    $unwind:
        {
	      "path" : "$google", 
	      "preserveNullAndEmptyArrays" : false
	    }
      },
      {
	    $match:
        {
	      "google.suspended": false,
	    }
      },
      {
	    $project:
        {
          "_id" : 0,
	      "CAPID" : 1,
	      "Name" : "$google.name.fullName", 
	      "email" : "$google.primaryEmail",    
	    }
      },
    ]);
  
  return pipeline;
}

export default class extends Group
{
  constructor(db, groupname, unit = "")
  {
    const domain = config.domain;
    const pipeline = makePipeline(unit, domain, groupname);
    const start_agg = pipeline_start;
    
	super( db, domain, groupname, pipeline, start_agg );
  }
}
