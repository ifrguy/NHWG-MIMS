const { config } = require("./config.js");
db = db.getSiblingDB( config.wing );
db.MbrContact.createIndex( { CAPID : 1 } );


