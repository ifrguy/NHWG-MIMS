#!/usr/bin/env node

const { config } = require("../getConfig.js");

console.log("# Run these commands to create your organizational units:\n");
Object.values(config.orgUnit).forEach(
  (ou) =>
  {
    console.log(`gam create ou "${ou}" parent "/"`);
  });
