db = db.getSiblingDB( "NHWG" );
db.Google.createIndex( { 'primaryEmail' : 1 } );
db.Google.createIndex( { "name.familyName" : 1 } );
db.Google.createIndex( { "externalIds.0.value" : 1 } );
