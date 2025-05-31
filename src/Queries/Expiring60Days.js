// Query to find members expiring between today and "days" (30) in the future.
// Sorted output by Unit, expiration date, last name
// 12Apr2017 MEG Updated
//
const { config } = require("../MIMS/config/getConfig.js");
db = db.getSiblingDB(config.wing);
var dfns = db.ENV.findOne({name:'DATEFNS'}).value;
//print(dfns);
load( dfns );
var days = 60;
var start = new Date();
var future = dateFns.addDays( start, days );
future = dateFns.endOfMonth( future ); 
var cur = db.Member.find({MbrStatus:'ACTIVE', Expiration: { $gte: start, $lte: future }},
 {_id:0,CAPID:1,NameLast:1,NameFirst:1,NameMiddle:1,Unit:1,Type:1,Expiration:1}).sort({Unit:1,NameLast:1,Expiration:1});
while ( cur.hasNext() ) {
  var m = cur.next();
  var dd = (m.Expiration.getMonth()+1).toString() + "/" + (m.Expiration.getDate()).toString() + "/" + (m.Expiration.getFullYear()).toString();
  print( m.CAPID, m.NameLast + "," , m.NameFirst, m.NameMiddle, m.Type, m.Unit, dd );
}

