// Find all active or trainee AP's
var cur=db.MemberAchievements.find( {AchvID: 193, $or:[{Status:"ACTIVE"},{Status:"TRAINING"}]}).sort({CAPID:1})
while ( cur.hasNext() ) {
  	 var r = cur.next();
  	 var m = db.Member.findOne({CAPID:r.CAPID});
  	 if ( m == null ) { 
  	   	print("CAPID:",r.CAPID,"Unkown Member");
  	   	continue; }
  	 print(r.CAPID,m.NameFirst,m.NameLast,r.Status,r.Expiration) 
}