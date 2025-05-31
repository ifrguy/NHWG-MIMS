const { config } = require("./config/getConfig.js");

db = db.getSiblingDB( config.wing );
db.Member.createIndex( {'NameLast':1} );
db.Member.createIndex( { CAPID : 1 }, { unique : 1 } );
db.MbrAchievements.createIndex( { CAPID : 1 } );
db.MbrAddresses.createIndex( { CAPID : 1 } );
db.MbrContact.createIndex( { CAPID : 1 } );

