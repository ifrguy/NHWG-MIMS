// Find Google accounts with an "externalIds" field
const { config } = require("../getConfig.js");
db = db.getSiblingDB(config.wing);
var cur = db.Google.find({externalIds:{$exists:true}});
while( cur.hasNext() ) {
   var m = cur.next();
   print('primaryEmail:' + m.primaryEmail + " " + m.externalIds[0].value);
}
