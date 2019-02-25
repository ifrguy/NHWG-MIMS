// Query to find members expired 30 or more days ago.
// Sorted output by Unit, expiration date, last name
// 01Sep17 MEG Updated
//
db = db.getSiblingDB( 'NHWG' );
var dfns = db.ENV.findOne({name:'DATEFNS'}).value;
//print(dfns);
load( dfns );
var LOG = false;
var daysBack = 30; // how many days back to start looking
var today = new Date();
var past = dateFns.subDays( today, daysBack );
var cur = db.Member.find({MbrStatus:'EXPIRED', Expiration: { $lte: past }},
 {_id:0,CAPID:1,NameLast:1,NameFirst:1,NameMiddle:1,Unit:1,Type:1,Expiration:1}).sort({Unit:1,CAPID:1,Expiration:1,NameLast:1});
while ( cur.hasNext() ) {
  var m = cur.next();
  if ( LOG ){
  	var dd = (m.Expiration.getMonth()+1).toString() + "/" + (m.Expiration.getDate()).toString() + "/" + (m.Expiration.getFullYear()).toString();
  	print("#", m.Unit, m.CAPID, m.NameLast, m.NameFirst, m.NameMiddle, m.Type, dd );
  }
  g = db.Google.findOne({externalIds:{$elemMatch:{value:{$eq:m.CAPID}}}});
  if ( g ) {
    print("gam suspend user",g.primaryEmail);
  }
  else {
    print("# Warning: No Google Account Found:", m.CAPID, m.NameLast, m.NameFirst, m.NameMiddle, m.Type);
  }
}
