#!/usr/bin/env node

const           { execSync } = require("child_process");

const           ADMIN_ACCOUNT = "dlipman";

const           SHARED_DRIVE_MANAGER = "wing-it";

const           UNITS =
      [
        'wing'
      ];

const           FOLDERS =
      [
        {
          name   : '/RESTRICTED',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'},
            { name : 'seniors',    access : 'contributor' }
          ],
          people :
          [
            { name : 'derrell-test', access : 'contributor' }
          ]
        },
        {
          name   : '/MEMBERS',
        },
        {
          name   : '/SENIORS',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'},
            { name : 'seniors',    access : 'contributor' }
          ]
        },

        {
          name   : '/RESTRICTED/A1 - Aerospace Education',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'},
            { name : 'ae',         access : 'contentmanager' }
          ],
          people :
          [
            { name : 'derrell-test', access : 'contributor' }
          ]
        },
        {
          name   : '/RESTRICTED/B1 - Cadet Programs',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'}
          ]
        },
        {
          name   : '/RESTRICTED/D1 - Education & Training',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'},
            { name : 'pd',         access : 'contentmanager' }
          ],
        },
        {
          name   : '/RESTRICTED/D3 - Finance',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'}
          ]
        },
        {
          name   : '/RESTRICTED/D4 - Administration',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'}
          ]
        },
        {
          name   : '/RESTRICTED/D5 - Personnel',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'}
          ]
        },
        {
          name   : '/RESTRICTED/D6 - Public Affairs',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'},
            { name : 'pa',         access : 'contentmanager'}
          ]
        },
        {
          name   : '/RESTRICTED/D7 - Supply',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'}
          ]
        },
        {
          name   : '/RESTRICTED/D8 - Transportation',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'}
          ]
        },
        {
          name   : '/RESTRICTED/E1 - Commander',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'}
          ]
        },
        {
          name   : '/RESTRICTED/E2 - Safety',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'}
          ]
        },
        {
          name   : '/RESTRICTED/Emergency Services',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'}
          ]
        },
        {
          name   : '/RESTRICTED/Flight Operations',
          groups :
          [
            { name : 'commanders', access : 'contentmanager'},
            { name : 'it',         access : 'contentmanager'}
          ]
        },

        // End of restricted folder list
        // ----------------------------
        // Begin of subdirectories

        {
          name   : '/RESTRICTED/A1 - Aerospace Education/AE POAs'
        },
        {
          name   : '/RESTRICTED/A1 - Aerospace Education/Internal Tasks'
        },
        {
          name   : '/RESTRICTED/A1 - Aerospace Education/External Tasks'
        },

        {
          name   : '/RESTRICTED/A1 - Aerospace Education/Internal Tasks/AEX'
        },
        {
          name   : '/RESTRICTED/A1 - Aerospace Education/Internal Tasks/AE Awards submitted'
        },
        {
          name   : '/RESTRICTED/A1 - Aerospace Education/Internal Tasks/Award Nominations'
        },
        {
          name   : '/RESTRICTED/A1 - Aerospace Education/Internal Tasks/Rocketry'
        },
        {
          name   : '/RESTRICTED/A1 - Aerospace Education/Internal Tasks/STEM kits'
        },

        {
          name   : '/RESTRICTED/A1 - Aerospace Education/External Tasks/AEMs assisted'
        },
        {
          name   : '/RESTRICTED/A1 - Aerospace Education/External Tasks/AEMs recruited'
        },
        {
          name   : '/RESTRICTED/A1 - Aerospace Education/External Tasks/External presentations'
        },

        {
          name   : '/RESTRICTED/B1 - Cadet Programs/Cadet Great Start'
        },
        {
          name   : '/RESTRICTED/B1 - Cadet Programs/Evaluations'
        },
        {
          name   : '/RESTRICTED/B1 - Cadet Programs/Goals Tracking'
        },
        {
          name   : '/RESTRICTED/B1 - Cadet Programs/Org Chart'
        },
        {
          name   : '/RESTRICTED/B1 - Cadet Programs/Other'
        },
        {
          name   : '/RESTRICTED/B1 - Cadet Programs/Schedules'
        },
        {
          name   : '/RESTRICTED/B1 - Cadet Programs/Squadron Activities'
        },

        {
          name   : '/RESTRICTED/D1 - Education & Training/Seniors Training'
        },

        {
          name   : '/RESTRICTED/D3 - Finance/Finance Committee Meetings'
        },
        {
          name   : '/RESTRICTED/D3 - Finance/Finance Committee Meetings/Agendas'
        },
        {
          name   : '/RESTRICTED/D3 - Finance/Finance Committee Meetings/Minutes'
        },

        {
          name   : '/RESTRICTED/D4 - Administration/File Plan'
        },
        {
          name   : '/RESTRICTED/D4 - Administration/Schedules and Hand Books'
        },
        {
          name   : '/RESTRICTED/D4 - Administration/Squadron Org Charts'
        },

        {
          name   : '/RESTRICTED/D5 - Personnel/Active Members'
        },
        {
          name   : '/RESTRICTED/D5 - Personnel/Active Members/Cadets'
        },
        {
          name   : '/RESTRICTED/D5 - Personnel/Active Members/Patrons'
        },
        {
          name   : '/RESTRICTED/D5 - Personnel/Active Members/Seniors'
        },
        {
          name   : '/RESTRICTED/D5 - Personnel/Awards except AE'
        },
        {
          name   : '/RESTRICTED/D5 - Personnel/Charters'
        },
        {
          name   : '/RESTRICTED/D5 - Personnel/Inactive Members'
        },
        {
          name   : '/RESTRICTED/D5 - Personnel/Misc'
        },
        {
          name   : '/RESTRICTED/D5 - Personnel/Org Chart'
        },
        {
          name   : '/RESTRICTED/D5 - Personnel/Promotions & Demotions'
        },
        {
          name   : '/RESTRICTED/D5 - Personnel/Uniforms'
        },

        {
          name   : '/RESTRICTED/D6 - Public Affairs/Newsletters'
        },

        {
          name   : '/RESTRICTED/D7 - Supply/Property Tag Photos'
        },

        {
          name   : '/RESTRICTED/D8 - Transportation/Completed CAPF 73s'
        },

        {
          name   : '/RESTRICTED/E1 - Commander/Backup Email Squadron Commander'
        },
        {
          name   : '/RESTRICTED/E1 - Commander/Member suspension paperwork (if applicable)'
        },
        {
          name   : '/RESTRICTED/E1 - Commander/Proof of Non-Discrimination annual briefing (roster or sign in sheet or copy of e-mail sent to membership)'
        },
        {
          name   : '/RESTRICTED/E1 - Commander/Rosters for all cadet activities for the past year'
        },
        {
          name   : '/RESTRICTED/E1 - Commander/Signed fundraising approval forms'
        },
        {
          name   : '/RESTRICTED/E1 - Commander/SUI Reports'
        }
      ];


function getAccess(unitName, group)
{
  return `${unitName}-${group}`;
}

function execAndPrint(command)
{
  let             output;

  console.log(`Command: ${command}`);
  output = execSync(command).toString();
  console.log(`Output:\n${output}`);
  console.log("---");
  return output.trim();
}

for (let unitName of UNITS)
{
  try
  {
    let             teamDriveId;
    let             driveName = `${unitName}-shared-drive`;

    try
    {
      execAndPrint(`gam info teamdrive teamdrive:${driveName} asadmin`);

      // Success means it exists. Do nothing.
      console.log(`Drive ${driveName} already exists. Skipping.\n---`);
      continue;
    }
    catch(e)
    {
      console.log(`Drive ${driveName} does not exist (${e}). Creating.\n---`);
    }

    // Create the shared drive
    teamDriveId = execAndPrint(
      `gam user ${ADMIN_ACCOUNT} create teamdrive ${driveName} asadmin errorretries 10 updateinitialdelay 20 updateretrydelay 5 returnidonly`);

    // Add the shared drive manager as this shared drive's manager
    execAndPrint(`gam user ${ADMIN_ACCOUNT} add drivefileacl ${teamDriveId} group ${SHARED_DRIVE_MANAGER} role manager`);

    // Let the unit's commanders and IT folks manager content (and add permissions) on this drive
    execAndPrint(`gam user ${ADMIN_ACCOUNT} add drivefileacl ${teamDriveId} group ${unitName}-commanders role contentmanager`);
    execAndPrint(`gam user ${ADMIN_ACCOUNT} add drivefileacl ${teamDriveId} group ${unitName}-it role contentmanager`);

    // Let all members of the unit access this drive read/write
    execAndPrint(`gam user ${ADMIN_ACCOUNT} add drivefileacl ${teamDriveId} group ${unitName}-members role viewer`);

    // TEMPORARY - DELETE ME!
    execAndPrint(`gam user ${ADMIN_ACCOUNT} add drivefileacl ${teamDriveId} user derrell-test role viewer`);

    for (let folder of FOLDERS)
    {
      // Create the folder
      let folderId =
        execAndPrint(`gam user ${ADMIN_ACCOUNT} create drivefolderpath fullpath "SharedDrives/${driveName}${folder.name}" returnidonly`);

      // If there are groups or people with explicit access, make it a
      // "limited access" folder by enabling inheritedPermissionsDisabled.
      if (folder.groups || folder.people)
      {
        execAndPrint(`gam user ${ADMIN_ACCOUNT} update drivefile id:${folderId} inheritedPermissionsDisabled true`);
      }

      // If there are groups or people specified, clear all ACLs and add in specific ones
      if (folder.groups)
      {
        // For each specified group...
        for (let group of folder.groups)
        {
          let             fullGroupName = `${unitName}-${group.name}`;

          // ... add content manager permission to the specified
          // group, for this folder. Don't change the manager
          // permission of the shared drive manager, however, if it is
          // repeated as a group here.
          if (fullGroupName != SHARED_DRIVE_MANAGER)
          {
            execAndPrint(`gam user ${ADMIN_ACCOUNT} add drivefileacl ${folderId} group ${fullGroupName} role ${group.access}`);
          }
        }
      }

      if (folder.people)
      {
        // Add content manager permission to additionally specified
        // people.
        for (let person of folder.people)
        {
          execAndPrint(`gam user ${ADMIN_ACCOUNT} add drivefileacl ${folderId} user ${person.name} role ${person.access}`);
        }
      }
    }

    // Remove the admin account as a manager now that we've established the proper manager
    execAndPrint(`gam user ${ADMIN_ACCOUNT} delete drivefileacl ${teamDriveId} ${ADMIN_ACCOUNT}`);
  }
  catch(e)
  {
    console.error(e);
  }
}
