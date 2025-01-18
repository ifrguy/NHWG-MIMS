db = db.getSiblingDB( "NHWG" );
db.Member.createIndex( { CAPID : 1 }, { unique : 1 } );
db.Member.createIndex( {'NameLast':1} );

