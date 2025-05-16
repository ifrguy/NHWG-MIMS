// Aerospace Education Officers group

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
          "Unit" : "$organization.Unit",
          "Duty" : 1,
          "Asst" : 1
	    }
      },
    ]);

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
