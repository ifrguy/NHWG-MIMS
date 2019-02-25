// Find new members that have joined in the last week,
// produce a csv file, with header.
// History:
// 02Oct18 MEG Created.

db = db.getSiblingDB( 'NHWG');
var dfns = db.ENV.findOne({name:'DATEFNS'}).value;
//print(dfns);
load( dfns );

var today = new Date();
// look back period
var sdate = dateFns.subWeeks( today, 1 );
print("CAPID,NameLast,NameFirst,Type,Unit,EMAIL");

// Run query to find new members
var cur = db.Member.find({$or: [ {Joined:{ $gte: sdate }}, { OrgJoined: {$gte: sdate }}]}).sort({Unit:1, NameLast:1});

while ( cur.hasNext() ) {
	var mbr = cur.next();
	var ctct = db.MbrContact.findOne( {CAPID:mbr.CAPID,Type:'EMAIL',Priority:'PRIMARY'});
	var ln = (mbr.NameSuffix == undefined? "" : mbr.NameLast + " " + mbr.NameSuffix);
	print(mbr.CAPID + ',' + ln + ',' + mbr.NameFirst +
			',' + mbr.Type + ',' + '"' + mbr.Unit + '"' + ',' + ctct.Contact);
}
