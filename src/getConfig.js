const fs = require("fs");
const config = JSON.parse(fs.readFileSync("config.json").toString());
const creds = JSON.parse(fs.readFileSync("credentials.json").toString());

module.exports = { config , creds };
