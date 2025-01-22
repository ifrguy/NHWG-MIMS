const fs = require("fs");
const config = JSON.parse(fs.readFileSync(__dirname + "/config.json").toString());
const creds = JSON.parse(fs.readFileSync(__dirname + "/credentials.json").toString());

module.exports = { config , creds };
