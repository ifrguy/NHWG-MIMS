const fs = require("fs");
const config = JSON.parse(fs.readFileSync(__dirname + "/MIMS/config.json").toString());
const creds = JSON.parse(fs.readFileSync(__dirname + "/MIMS/credentials.json").toString());

module.exports = { config , creds };
