const { config } = require("./getConfig.js");
db = db.getSiblingDB( config.wing );
db.MbrAddresses.createIndex( { CAPID : 1 } );

