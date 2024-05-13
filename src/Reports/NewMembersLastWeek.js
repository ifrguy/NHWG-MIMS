// Find new members that have joined in the last week,
// produce a csv file, with header.

// History:
// 12May24 MEG Catch missing email contact error.
// 29Aug23 MEG "getSiblingDB" call removed, DB passed on command line.
// 02Oct18 MEG Created.

var dfns = db.ENV.findOne({name:'DATEFNS'}).value;
load( dfns );

var today = new Date();
// look back period
var sdate = dateFns.subWeeks( today, 1 );
print("CAPID,NameLast,NameFirst,Type,Unit,EMAIL");
// Member email address
var email = '';

// Run query to find new members
var cur = db.Member.find({$or: [ {Joined:{ $gte: sdate }}, { OrgJoined: {$gte: sdate }}]}).sort({Unit:1, NameLast:1});


while ( cur.hasNext() ) {
    var mbr = cur.next();
    print( "CAPID:", mbr.CAPID );
    try {
	email = db.MbrContact.findOne( {CAPID:mbr.CAPID,Type:'EMAIL',Priority:'PRIMARY'}).Contact;
    }
    catch ( e ) {
	email = '***UNKNOWN***';
    }
    var ln = (mbr.NameSuffix == undefined? "" : mbr.NameLast + " " + mbr.NameSuffix);
    print(mbr.CAPID + ',' + ln + ',' + mbr.NameFirst +
    	  ',' + mbr.Type + ',' + '"' + mbr.Unit + '"' + ',' + email);
}
