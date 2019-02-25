// Find all active or trainee AP's and generate a Google mailing list
// 
var cur=db.MemberAchievements.find( {AchvID: 193, $or:[{Status:"ACTIVE"},{Status:"TRAINING"}]}).sort({CAPID:1})
while ( cur.hasNext() ) {
  	 var r = cur.next();
  	 var m = db.Member.findOne({CAPID:r.CAPID});
  	 if ( m == null ) { 
  	   	print("CAPID:",r.CAPID,"Unknown Member");
  	   	continue; }
  	 var c = db.MemberContact.findOne({CAPID:r.CAPID,Type:"EMAIL",Priority:"PRIMARY"});
  	 var em = "<" + c.Contact + ">" + ",";
  	 var name = '"' + m.NameFirst + " " + m.NameLast + " " +r.CAPID + '"';
	 print(name,em);
}