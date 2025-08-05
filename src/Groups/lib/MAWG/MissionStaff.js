// Mission Staff group

// Load my super class definition
import { Group } from '../Group.js';
import { config } from "../../../MIMS/config/getConfig.js";

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
			    61,                 // IC3
			    63,                 // OSC
			    64,                 // PSC
			    67,                 // AOBD
			    68,                 // GBD
			    72,                 // PIO
			    75,                 // CUL
			    76,                 // MRO
			    77,                 // MSO
			    78,                 // LO
			    80,                 // MSA
			    125,                // IC2
			    128,                // IC1
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
          "email" : "$google.primaryEmail",
          "Unit" : "$google.customSchemas.Member.Unit",
          "Achv" : "$AchvID",
          "Status" : "$Status"
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
