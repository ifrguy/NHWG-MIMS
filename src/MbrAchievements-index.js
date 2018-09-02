db = db.getSiblingDB( "NHWG" );
db.Member.createIndex( { CAPID : 1 }, { unique : 1 } );
db.Member.createIndex( {'NameLast':1} );

db = db.getSiblingDB( "NHWG" );
db.MbrAchievements.createIndex( { CAPID : 1 } );

db = db.getSiblingDB( "NHWG" );
db.MbrAddresses.createIndex( { CAPID : 1 } );

db = db.getSiblingDB( "NHWG" );
db.MbrContact.createIndex( { CAPID : 1 } );

