// Query to find members expired members.
// Sorted output by Unit, expiration date, last name
// 28Sep2019 MEG New.
//
db = db.getSiblingDB( 'NHWG' );
var dfns = db.ENV.findOne({name:'DATEFNS'}).value;
//print(dfns);
load( dfns );
var days = 30;
var start = new Date();
var future = dateFns.addDays( start, days );
future = dateFns.endOfMonth( future ); 
print('CAPID,NameLast,NameFirst,Type,Unit,Expiration,Email');
var cur = db.Member.find({MbrStatus:'EXPIRED'},
 {_id:0,CAPID:1,NameLast:1,NameFirst:1,Unit:1,Type:1,Expiration:1}).sort({Unit:1,Expiration:1,NameLast:1});
while ( cur.hasNext() ) {
  var m = cur.next();
  var lastName = m.NameLast + (m.NameSuffix == undefined? "": " " + m.NameLast );
  var cnt = db.MbrContact.findOne({CAPID:m.CAPID,Type:'EMAIL',Priority:'PRIMARY'});
  var dd = (m.Expiration.getMonth()+1).toString() + "/" + (m.Expiration.getDate()).toString() + "/" + (m.Expiration.getFullYear()).toString();
  print( m.CAPID + ',' + lastName + ',' + m.NameFirst  + ','+ m.Type + ',' + m.Unit + ','+ dd + ','+ cnt.Contact );
}

