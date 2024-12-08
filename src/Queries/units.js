const { config } = require("../config.js");
db = db.getSiblingDB(config.wing);
var cur = db.Google.find({},{_id:0,orgUnitPath:1}).sort({orgUnitPath:1})
while ( cur.hasNext() ) {
    u = cur.next()
    print(u.orgUnitPath);
}

