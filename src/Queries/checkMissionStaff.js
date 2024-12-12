// Scan mission staff  mailing list for active members and valid wing addresses

// History:
// 07Dec24 DJL Consolidate configuration files for single point changes.
// 11Dec17 MEG Created.
//
const { config } = require("../getConfig.js");
db = db.getSiblingDB(config.wing);

// find all non-wing emails in collection
var cur = db.missionstaff.find();

while ( cur.hasNext() ) {
    rec = cur.next();
    em = rec[ 'Email address' ];
    mem = db.MbrContact.findOne( { 'Contact' : em } );
    if ( mem ) {
	gm = db.Google.findOne( { externalIds:{ $elemMatch: { value : mem.CAPID }}} );
	if ( gm ) {
	    print( 'Found:',gm.name['fullName'], em, 'should be changed to:',gm.primaryEmail );
	} else {
	    var nm = db.Member.findOne( {CAPID: mem.CAPID});
	    print('NO Wing Email', mem.CAPID, nm.Type, nm.MbrStatus, nm.NameFirst,
		 nm.NameLast);
	}
    }
    else {
	print( 'WARN: Not listed in eServices:',em, 'should be removed from group.' );
    }
}
