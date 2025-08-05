const { config } = require("./config/getConfig.js");
db = db.getSiblingDB( config.wing );
db.Google.createIndex( { 'primaryEmail' : 1 } );
db.Google.createIndex( { "name.familyName" : 1 } );
db.Google.createIndex( { "externalIds.0.value" : 1 } );
