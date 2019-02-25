// Find Google accounts with an "externalIds" field
db = db.getSiblingDB("NHWG");
var cur = db.Google.find({externalIds:{$exists:true}});
while( cur.hasNext() ) {
   var m = cur.next();
   print('primaryEmail:' + m.primaryEmail + " " + m.externalIds[0].value);
}
