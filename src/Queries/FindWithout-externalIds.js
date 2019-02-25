// Find Google accounts that do NOT have an "externalIds" field
db = db.getSiblingDB("NHWG");
var cur = db.Google.find({externalIds:{$exists:false}});
while( cur.hasNext() ) {
   var m = cur.next();
   print('primaryEmail:' + m.primaryEmail );
}
