const { config } = require("./config/getConfig.js");
db = db.getSiblingDB( config.wing );
db.Member.createIndex( { CAPID : 1 }, { unique : 1 } );
db.Member.createIndex( {'NameLast':1} );

