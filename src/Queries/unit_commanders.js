// Find all current unit commanders, their units, names and wing email addresses
//
// 07Dec24 DJL Consolidate configuration files for single point changes.
// 09Apr18 MEG Created

const { config } = require("../getConfig.js");
db = db.getSiblingDB(config.wing);

var cur = db.Commanders.find( {Wing:'NH'} ).sort( {Unit:1} );
print( 'orgUnitPath,CAPID,fullName,primaryEmail' );
while ( cur.hasNext() ) {
    unit = cur.next();
//    print("Unit:", unit.Unit);
    gm = db.Google.findOne( { externalIds:{ $elemMatch: { value : unit.CAPID }}} );
    print( gm.orgUnitPath + ',' + unit.CAPID + ',' + gm.name.fullName + ',' + gm.primaryEmail );
}
