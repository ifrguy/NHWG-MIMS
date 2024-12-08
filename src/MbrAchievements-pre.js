const { config } = require("./config.js");
db=db.getSiblingDB(config.wing);
//db.MbrAchievements.remove({});
// remove() deprecated
db.MbrAchievements.deleteMany({});
