// Find Google accounts that do NOT have an "externalIds" field
const { config } = require("../config.js");
db = db.getSiblingDB(config.wing);
var cur = db.Google.find({externalIds:{$exists:false}});
while( cur.hasNext() ) {
   var m = cur.next();
   print('primaryEmail:' + m.primaryEmail );
}
