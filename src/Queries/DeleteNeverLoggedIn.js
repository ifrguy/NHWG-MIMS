// Scan Google for Cadet accounts never logged in, emit gam delete user commands
db = db.getSiblingDB("NHWG");
var cur = db.Google.find({ 
    "organizations.description" : "CADET", 
    "lastLoginTime" : ISODate("1969-12-31T20:00:00.000-0400")
}, { 
    "creationTime" : 1.0, 
    "externalIds" : 1.0, 
    "lastLoginTime" : 1.0, 
    "name" : 1.0, 
    "orgUnitPath" : 1.0, 
    "organizations" : 1.0, 
    "primaryEmail" : 1.0, 
    "suspended" : 1.0, 
    "_id" : 0.0
});
while ( cur.hasNext() ) {
  var m = cur.next();
  print( 'gam delete user', m.primaryEmail );
}

