// Group: aeo@nhwg.cap.gov
// Purpose: Unit Aerospace Education Officers

// History:
// 18Feb25 DJL Derived MAWG classses from NHWG ones
// 06Jul22 MEG Group leaf class includes mainline.
// 29May22 MEG Created

// Load my super class definition
import { Group } from '../Group.js';
import { config } from "../../../getConfig.js";

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'DutyPosition';

// MongoDB aggregation pipeline to find potential group members
function makePipeline(unit, domain, groupname)
{
  let pipeline =
      [
        {
	      $match:
          {
	        Duty: /aerospace ed/i,
	      }
        }
      ];
  
  // If we're given a unit, we need to join with Organization to get
  // unit numbers from orgids, and then filter on the given unit
  if (unit)
  {
    pipeline = pipeline.concat(
      pipeline,
      [
        {
          $lookup:
          {
            "from" : "Organization",
            "localField" : "ORGID",
            "foreignField" : "ORGID",
            "as" : "organization"
          }
        },
        {
          $unwind:
          {
            "path" : "$organization",
            "preserveNullAndEmptyArrays" : false
          }
        },
        {
          $match:
          {
            "organization.Unit" : unit
          }
        }
      ]);
  }
  
  pipeline = pipeline.concat(
    pipeline,
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

export default class AE extends Group
{
  constructor(db, groupname, unit = "")
  {
    const domain = config.domain;
    const pipeline = makePipeline(unit, domain, groupname);
    const start_agg = pipeline_start;
    
	super( db, domain, groupname, pipeline, start_agg );
  }
}
