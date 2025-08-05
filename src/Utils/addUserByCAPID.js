#!/usr/bin/env node

import util from "util";
import Confirm from "prompt-confirm";
import { parseArgs } from "node:util";
import { exec } from "child_process";
import { MongoClient } from "mongodb";
import { config, creds } from "../MIMS/config/getConfig.js";

const execP = util.promisify(exec);

// bold red text (ansi sequence), and return to normal text
const BOLD_RED = "\x1b[1m\x1b[31m";
const BOLD_GREEN = "\x1b[1m\x1b[32m";
const NORMAL = "\x1b[0m";

// We use the configuration's `makeMemberEmailAddress` Python expression.
// Python uses lower() and upper(); JS uses toLowerCase(), toUpperCase()
// There are probably more mappings we should create... Hmmm...
String.prototype.lower = String.prototype.toLowerCase;
String.prototype.upper = String.prototype.toUpperCase;

const uri =
      [
        "mongodb://",
        encodeURIComponent(creds.mims.user),
        ":",
        encodeURIComponent(creds.mims.password),
        "@",
        `${config.mongoDb.host}:${config.mongoDb.port}`,
        "/",
        config.mongoDb.db
      ].join("");

// Create a new MongoClient
const client = new MongoClient(uri);


async function main()
{
  // Parse arguments
  let { values : { help, email, notify }, positionals } = parseArgs(
    {
      allowPositionals : true,
      options :
      {
        help :
        {
          type  : "boolean",
          short : "h"
        },
        email :
        {
          type  : "string",
          short : "e",
        },
        notify :
        {
          type  : "string",
          short : "n",
        }
      }
    });

  // CAPID is the first positional (non-option) argument
  const CAPID = positionals.length > 0 ? +positionals[0] : 0;
  
  if (help || CAPID < 100000 || CAPID > 999999)
  {
    console.log(
      [
        "addUserByCAPID",
        "  [-h|--help]",
        "  [-e|--email <override_wing_email_address>]",
        "  [-n|--notify <overide_welcome_message_email_address>]",
        "  <CAPID>"
      ].join("\n"));
    process.exit(0);
  }

  try
  {
    const db = await client.db("MAWG");
    const cursor =
          await db.collection("MbrContact")
          .aggregate(
            [
              {
                $match :
                {
                  CAPID        : CAPID,
	              Priority     : "PRIMARY",
	              Type         : "EMAIL"
                }
              },
              {
                $lookup :
                {
	              from         : "Member",
	              localField   : "CAPID",
	              foreignField : "CAPID",
	              as           : "member"
                }
              },
              {
	            $unwind:
                {
	              path : "$member",
	            }
              }
            ]);

    const memberContact = (await cursor.toArray())[0];
    console.log("memberContact=", memberContact);
    if (! memberContact)
    {
      console.log(`${BOLD_RED}CAPID ${CAPID} not found${NORMAL}\n`);
      process.exit(1);
    }

    const member = Object.assign({}, memberContact.member);
    member.NameFirst = member.NameFirst.trim().replace(/ /g, "-");
    member.NameLast = member.NameLast.trim().replace(/ /g, "-");

    // Create the function for generating an email address, and then generate it.
    // We eliminoate all appostrophes spaces, and append the domain
    const makeEmailAddress = new Function("m", `return ${config.makeMemberEmailAddress}`);
    email ||= makeEmailAddress(member).replace("[' ]", "") + "@" + config.domain;

    // Confirm that the address does not already exist.
    try
    {
      const gamcmd = `gam info user ${email}`;
      const { stdout, stderr } = await execP(gamcmd);
      console.log(`${stdout}\n${BOLD_RED}User account ${email} already exists${NORMAL}\n`);
      process.exit(1);
    }
    catch(e)
    {
      // We hope for and expect an error, indicating that the email address does not exist
    }

    // Build the gam command to create the new user account
    const gamcmd =
          [
            `gam create user ${email}`,
            `givenname "${member.NameFirst}"`,
            `familyname "${member.NameLast}"`,
            `orgunitpath "${config.orgUnit[member.Unit]}"`,
            `Member.CAPID ${CAPID}`,
            `Member.Type "${member.Type}"`,
            `Member.Unit "${member.Unit}"`,
            `password uniquerandom`,
            `changepassword true`,
            `recoveryemail "${notify || memberContact.Contact}"`,
            `otheremail home "${notify || memberContact.Contact}"`,
            `notify "${notify || memberContact.Contact}"`,
            `subject "Welcome to your ${config.wing} account"`,
            `file ${config.mimsSourceTopDir}/${config.welcomeMessage}`,
            `html true`
          ].join("\n\t");
    console.log(`About to execute the following command:\n${BOLD_GREEN}${gamcmd}${NORMAL}`);

    // Issue warnings if option-specified notify email differs from what's in eServices
    if (notify && notify != memberContact.Contact)
    {
      console.log(`${BOLD_RED}Notify contact differs from eServices: ${notify} vs ${memberContact.Contact}${NORMAL}`);
    }

    // Request confirmation to continue
    let doIt = await new Confirm('Continue?').run();
    if (! doIt)
    {
      console.log("Aborted");
      process.exit(2);
    }

    // They asked for us to continue. Create the account!
    try
    {
      const { stdout, stderr } = await execP(gamcmd.replaceAll("\n\t", " "));
    }
    catch(e)
    {
      console.error(`${BOLD_RED}Could not create user account:${NORMAL}`, e);
    }

  }
  finally
  {
    await client.close();
  }
}

await main();
