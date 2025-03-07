// Instructor Pilots group

// Load my super class definition
import { Group } from '../Group.js';
import { config } from "../../../getConfig.js";

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'MbrAchievements';


// MongoDB aggregation pipeline to find potential group members
function makePipeline(unit, domain, groupname)
{
  let pipeline =
      [
        {
          "$match" :
          {
            "AchvID" :
            {
              "$in" :
              [
                59,             // Instructor Pilot - Airplane
                101,            // Instructor Pilot - Glider
                195,            // Instructor Pilot - G1000
                233,            // Instructor Pilot - Balloon
                237             // Instructor Pilot - Tow
              ]
            },
            "$or" :
            [
              {
                "Status" : "ACTIVE"
              },
              {
                "Status" : "TRAINING"
              }
            ]
          }
        },
        {
          "$lookup" :
          {
            "from" : "Google",
            "localField" : "CAPID",
            "foreignField" : "customSchemas.Member.CAPID",
            "as" : "google"
          }
        },
        {
          "$unwind" :
          {
            "path" : "$google"
          }
        }
      ];
  
  if (unit)
  {
    pipeline = pipeline.concat(
      [
        {
          "$match" :
          {
            "google.customSchemas.Member.Unit" : unit
          }
        }
      ]);
  }
  
  pipeline = pipeline.concat(
    [
      {
        "$project" :
        {
          "CAPID" : 1,
	      "Name" : "$google.name.fullName",
          "email" : "$google.primaryEmail"
        }
      }
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
