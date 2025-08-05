// Wing Directors group

// Load my super class definition
import { Group } from '../Group.js';
import { config } from "../../../MIMS/config/getConfig.js";

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'DutyPosition';

// MongoDB aggregation pipeline to find potential group members
function makePipeline(unit, domain, groupname)
{
  const pipeline =
        [
          {
	        $match:
            {
	          Duty : /director/i
	        }
          },

          {
	        $lookup:
	        {
	          from : "Member",
	          localField : "CAPID",
	          foreignField : "CAPID",
	          as : "member"
	        }

          },
          {
	        $unwind:
            {
	          path : "$member",
	          preserveNullAndEmptyArrays : false // optional
	        }
          },
          {
	        $match:
            {
	          "member.MbrStatus" : "ACTIVE",
	        }
          },
          {
	        $lookup:
	        {
	          from : "Google",
	          localField : "CAPID",
	          foreignField : "customSchemas.Member.CAPID",
	          as : "google"
	        }

          },
          {
	        // flatten array
	        $unwind:
            {
	          path : "$google",
	          preserveNullAndEmptyArrays : false // optional
	        }
          },
          {
	        $project: {
	          CAPID : 1,
	          Name : "$google.name.fullName",
	          email : "$google.primaryEmail",
              Unit : "$google.customSchemas.Member.Unit",
              Duty : "$Duty",
              Asst : 1
	        }
          },
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
