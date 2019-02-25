//Find new members that have joined since date specified in var sdate.
//Produce a csv file, with header, sorted by join date and unit.
//This is a template for google
//db = db.getSiblingDB( 'NHWG');
//load('C:/Users/meg/work/NHWG/bin/dateFns.js');
var dfns = db.ENV.findOne({name:'DATEFNS'}).value;
//print(dfns);
load( dfns );

// Start date for query. Set year, month and day here!
// Note month is zero based 0=Jan, 1=Feb...
var sdate = new Date(2017, 0, 1 );
var cur = db.Member.find({Joined:{ $gte: sdate }},
 {_id:0,CAPID:1,Joined:1,NameLast:1,NameFirst:1,
  NameMiddle:1,Unit:1,Type:1}).sort({Joined:1,Unit:1});
print("CAPID,NameLast,NameFirst,Type,Unit,Joined");
while ( cur.hasNext() ) {
	var mbr = cur.next();
	print(mbr.CAPID + ',' + mbr.NameLast + ',' + mbr.NameFirst +
			',' + mbr.Type + ',' + mbr.Unit + ',' + mbr.Joined);
}
