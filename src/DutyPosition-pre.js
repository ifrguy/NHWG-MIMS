const { config } = require("./getConfig.js");
db=db.getSiblingDB(config.wing);
db.DutyPosition.remove({});
