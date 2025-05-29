#!/usr/bin/env node

import util from "util";
import Confirm from "prompt-confirm";
import { parseArgs } from "node:util";
import { exec } from "child_process";
import { MongoClient } from "mongodb";
import { config, creds } from "./getConfig.js";
import { Group } from "../Groups/lib/Group.js";

const execP = util.promisify(exec);

// bold red text (ansi sequence), and return to normal text
const BOLD_RED = "\x1b[1m\x1b[31m";
const BOLD_GREEN = "\x1b[1m\x1b[32m";
const NORMAL = "\x1b[0m";

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
  let { values : { help, libDir }, positionals } = parseArgs(
    {
      allowPositionals : false,
      options :
      {
        help :
        {
          type  : "boolean",
          short : "h"
        },
        lib :
        {
          type  : "string",
          short : "L",
        }
      }
    });

  if (help)
  {
    console.log(
      [
        "updateGroupsJob.js",
        "  [-h|--help]",
        "  [-l|--lib <libDir>]"
      ].join("\n"));
    process.exit(0);
  }

  try
  {
    const db = await client.db("MAWG");

    // Use either the specified library directory, or the default
    libDir = libDir || `${config.mimsSourceTopDir}/Groups/lib`;

    for (let group of config.groups)
    {
      const { default: groupClass } = await import(`${libDir}/${group.file}`);
      const groupInst = new groupClass(db, group.name, group.unit);
      await groupInst.updateGroup();
    }
  }
  finally
  {
    await client.close();
  }
}

await main();
