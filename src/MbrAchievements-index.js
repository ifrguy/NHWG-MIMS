const { config } = require("./config.js");
db = db.getSiblingDB( config.wing );
db.MbrAchievements.createIndex( { CAPID : 1 } );


