const { config } = require("./getConfig.js");
db = db.getSiblingDB( config.wing );
db.MbrAchievements.createIndex( { CAPID : 1 } );


