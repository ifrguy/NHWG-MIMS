const { config } = require("./getConfig.js");
db=db.getSiblingDB(config.wing);
//db.MbrAchievements.remove({});
// remove() deprecated
db.MbrAchievements.deleteMany({});
