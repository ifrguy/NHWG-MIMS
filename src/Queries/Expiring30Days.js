// Query to find members expiring between today and "days" (30) in the future.
// Sorted output by Unit, last name
// 01Oct2018 MEG Updated.
// 12Apr2017 MEG Updated.
//
const { config } = require("../config.js");
db = db.getSiblingDB(config.wing);
var dfns = db.ENV.findOne({name:'DATEFNS'}).value;
load( dfns );

var days = 30;
var start = new Date();
var future = dateFns.addDays( start, days );
future = dateFns.endOfMonth( future ); 
// CSV header
print('CAPID,NameLast,NameFirst,Type,Unit,Expiration,Email');

// Run query to find memberships expiring in the future.
var cur = db.Member.find({MbrStatus:'ACTIVE', Expiration: { $gt: start, $lt: future }},
 {_id:0,CAPID:1,NameLast:1,NameFirst:1,Unit:1,Type:1,Expiration:1}).sort({Unit:1,NameLast:1});
while ( cur.hasNext() ) {
  var m = cur.next();
  var lastName = m.NameLast + (m.NameSuffix == undefined? "": " " + m.NameLast );
  var cnt = db.MbrContact.findOne({CAPID:m.CAPID,Type:'EMAIL',Priority:'PRIMARY'});
  var dd = (m.Expiration.getMonth()+1).toString() + "/" + (m.Expiration.getDate()).toString() + "/" + (m.Expiration.getFullYear()).toString();
  print( m.CAPID + ',' + lastName + ',' + m.NameFirst  + ','+ m.Type + ',' + m.Unit + ','+ dd + ','+ cnt.Contact );
}

