db = db.getSiblingDB("NHWG");
var cur = db.Google.find({},{_id:0,orgUnitPath:1}).sort({orgUnitPath:1})
while ( cur.hasNext() ) {
    u = cur.next()
    print(u.orgUnitPath);
}

