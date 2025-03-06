// Aerospace Education Members group

// Load my super class definition
import { Group } from '../Group.js';
import { config } from "../../../getConfig.js";

// Name of collection on which the aggregation pipeline beings search
const pipeline_start = 'Member';

// MongoDB aggregation pipeline to find potential group members
function makePipeline(unit, domain, groupname)
{
  const pipeline =
        [
          {
            "$match" :
            {
              "Type" : "AEM",
              "MbrStatus" : "ACTIVE"
            }
          },
          {
            "$lookup" :
            {
              "from" : "MbrContact",
              "localField" : "CAPID",
              "foreignField" : "CAPID",
              "as" : "contacts"
            }
          },
          {
            "$unwind" :
            {
              "path" : "$contacts",
              "preserveNullAndEmptyArrays" : true
            }
          },
          {
            "$sort" :
            {
              "NameLast" : 1
            }
          },
          {
            "$match" :
            {
              "contacts.Priority" : "PRIMARY",
	          "contacts.Type" :  /^EMAIL/,
            }
          },
          {
            "$project" :
            {
              "_id" : 0,
              "CAPID" : 1,
              "MbrType" : "$Type",
              "email" : "$contacts.Contact",
              "Name" :
              {
                "$concat" :
                [
                  "$NameFirst",
                  " ",
                  "$NameLast"
                ]
              }
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
