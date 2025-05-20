const { config } = require("./getConfig.js");
db = db.getSiblingDB( config.wing );
db.MbrContact.createIndex( { CAPID : 1 } );


