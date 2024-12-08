const { config } = require("./config.js");
db = db.getSiblingDB( config.wing );
db.MbrAddresses.createIndex( { CAPID : 1 } );

