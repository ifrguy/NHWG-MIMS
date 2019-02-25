// Query to find members expiring two months out
// Sorted output by Unit, expiration date, last name
// 22Nov18 MEG
//
var db = db.getSiblingDB( 'NHWG' );
load( db.ENV.findOne({name:'DATEFNS'}).value);
load( db.ENV.findOne({name:'stringFormat'}).value);
// Keyword template string
var ktemplate = '{capid},{namelast},{namefirst},{type},{unit},{expiration},{email}';
// Positional notation template string
var ptemplate = '{0},{1},{2},{3},{4},{5},{6}';
var days = 1;
var today = dateFns.startOfMonth( new Date() );
// start date of next month
var start = dateFns.addDays( dateFns.endOfMonth( today ), days );
// end of next month
var end_date = dateFns.endOfMonth( start );
print('CAPID,NameLast,NameFirst,Type,Unit,Expiration,Email');
var cur = db.Member.find({MbrStatus:'ACTIVE', Expiration: { $gt: start, $lt: end_date }}).sort({Unit:1,Expiration:1,NameLast:1});
while ( cur.hasNext() ) {
  var m = cur.next();
  var lastName = m.NameLast + (m.NameSuffix? " " + m.NameSuffix : '' );
  var cnt = db.MbrContact.findOne({CAPID:m.CAPID,Type:'EMAIL',Priority:'PRIMARY'});
  var dd = (m.Expiration.getMonth()+1).toString() + "/" + (m.Expiration.getDate()).toString() + "/" + (m.Expiration.getFullYear()).toString();
//  print( ktemplate.formatUnicorn( {'capid': m.CAPID,
//				   'namelast': lastName,
//				   'namefirst' : m.NameFirst,
//				   'type' : m.Type,
//				   'unit' : m.Unit,
//				   'expiration' : dd ,
//				   'email': cnt.Contact} ));
  print( ptemplate.formatUnicorn( m.CAPID, lastName, m.NameFirst,
				  m.Type, m.Unit, dd, (cnt? cnt.Contact : 'UNKNOWN' )));
}

