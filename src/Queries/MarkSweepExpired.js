//MarkSweepExpired: Check for Expiration dates starting from look_back days ago
//mark those members as EXMEMBER.
//This is a maintainace function and should probably be run by the DBA a few times a year
//to mark any members missed by MIMS.
//NOTE: must be run with find, update privileges or by root DBA.
//
//History:
// 07Dec2024 DJL Consolidate configuration files for single point changes.
// 03Apr2019 MEG Created.
//

const { config } = require("../config.js");
var db = db.getSiblingDB(config.wing);
var LOG = true;
load( db.ENV.findOne({name:'DATEFNS'}).value );
var today = new Date();
var look_back_days = 90;
var look_back = dateFns.subDays( today, look_back_days );
var cursor = db.getCollection("Member").aggregate(
    [
        { 
            "$match" : {
                "MbrStatus" : "EXPIRED", 
                "Expiration" : {
                    "$lt" : look_back
                }
            }
        }
    ], 
    { 
        "allowDiskUse" : false
    }
);
while ( cursor.hasNext() ) {
    let rec = cursor.next();
    if ( LOG ) {
    	print( "Marking: ", rec.CAPID, rec.NameLast, rec.NameFirst, rec.MbrStatus, rec.Expiration );
    }
	db.Member.updateOne( { CAPID: rec.CAPID }, { $set: { MbrStatus: "EXMEMBER" }}, { upsert: false, multi: false } );
}
