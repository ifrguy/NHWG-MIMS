#!/usr/bin/env node

/**
 * Extend an attribute set
 *
 * @param base {Object}
 *   The attribute set to be extended. This object is not modified.
 *
 * @param attributes {Object}
 *   The attributes to be overridden or added to the base attributes. This
 *   object is not modified.
 *
 * @return {Object}
 *   The combined attributes containing all members of `base` plus all members
 *   of `attributes`. The latter takes precedence in case of overlap.
 */
function extend(base, attributes)
{
  return Object.assign({}, base, attributes);
}

/**
 * Create a new group given a specified configuration
 *
 * @param config {Object}
 *   The attribute set to be used for creating the group
 */
function createGroup(config)
{
  let             command = [ "gam", "create", "group" ];
  
  // Confirm mandatory fields are provided
  [ "email", "name", "description" ].forEach(
    (key) =>
    {
      if (typeof config[key] != "string" || config[key].length === 0)
      {
        throw new Error(`Missing key "${key}"`);
      }
    });
  
  // Clone the configuration
  config = Object.assign({}, config);
  
  // Add the group name
  command.push(config.email);
  
  // Remove email from the configuration now
  delete config.email;
  
  for (let key in config)
  {
    command.push(key);
    command.push(config[key]);
  }
  
  command = command.join(" ");
  
  console.log(command, "\n");
}

/**
 * The default attributes for an UNMODERATED group
 * Reference: https://github.com/GAM-TEAM/GAM/wiki/Groups#definitions 
 */
const CONFIG_DEFAULT =
      {
        "allowExternalMembers": "false",
        "allowGoogleCommunication": "false",
        "allowWebPosting": "true",
        "archiveOnly": "false",
        "customFooterText": "",
        "defaultMessageDenyNotificationText": "",
        "defaultSender": "DEFAULT_SELF",
        "enableCollaborativeInbox": "false",
        "favoriteRepliesOnTop": "true",
        "includeCustomFooter": "false",
        "includeInGlobalAddressList": "true",
        "isArchived": "false",
        "maxMessageBytes": 26214400,
        "membersCanPostAsTheGroup": "false",
        "messageDisplayFont": "DEFAULT_FONT",
        "messageModerationLevel": "MODERATE_NONE",
        "replyTo": "REPLY_TO_IGNORE",
        "sendMessageDenyNotification": "false",
        "showInGroupDirectory": "false",
        "spamModerationLevel": "MODERATE",
        "whoCanAdd": "ALL_OWNERS_CAN_ADD",
        "whoCanAddReferences": "NONE",
        "whoCanApproveMembers": "ALL_OWNERS_CAN_APPROVE",
        "whoCanApproveMessages": "OWNERS_AND_MANAGERS",
        "whoCanAssignTopics": "OWNERS_AND_MANAGERS",
        "whoCanAssistContent": "OWNERS_AND_MANAGERS",
        "whoCanBanUsers": "OWNERS_ONLY",
        "whoCanContactOwner": "ALL_MEMBERS_CAN_CONTACT",
        "whoCanDeleteAnyPost": "OWNERS_AND_MANAGERS",
        "whoCanDeleteTopics": "OWNERS_AND_MANAGERS",
        "whoCanDiscoverGroup": "ALL_IN_DOMAIN_CAN_DISCOVER",
        "whoCanEnterFreeFormTags": "OWNERS_AND_MANAGERS",
        "whoCanHideAbuse": "OWNERS_AND_MANAGERS",
        "whoCanInvite": "ALL_OWNERS_CAN_INVITE",
        "whoCanJoin": "INVITED_CAN_JOIN",
        "whoCanLeaveGroup": "NONE_CAN_LEAVE",
        "whoCanLockTopics": "OWNERS_AND_MANAGERS",
        "whoCanMakeTopicsSticky": "OWNERS_AND_MANAGERS",
        "whoCanMarkDuplicate": "OWNERS_AND_MANAGERS",
        "whoCanMarkFavoriteReplyOnAnyTopic": "OWNERS_AND_MANAGERS",
        "whoCanMarkFavoriteReplyOnOwnTopic": "OWNERS_AND_MANAGERS",
        "whoCanMarkNoResponseNeeded": "OWNERS_AND_MANAGERS",
        "whoCanModerateContent": "OWNERS_AND_MANAGERS",
        "whoCanModerateMembers": "OWNERS_ONLY",
        "whoCanModifyMembers": "OWNERS_ONLY",
        "whoCanModifyTagsAndCategories": "OWNERS_AND_MANAGERS",
        "whoCanMoveTopicsIn": "OWNERS_AND_MANAGERS",
        "whoCanMoveTopicsOut": "OWNERS_AND_MANAGERS",
        "whoCanPostAnnouncements": "OWNERS_AND_MANAGERS",
        "whoCanPostMessage": "ALL_IN_DOMAIN_CAN_POST",
        "whoCanTakeTopics": "OWNERS_AND_MANAGERS",
        "whoCanUnassignTopic": "OWNERS_AND_MANAGERS",
        "whoCanUnmarkFavoriteReplyOnAnyTopic": "OWNERS_AND_MANAGERS",
        "whoCanViewGroup": "ALL_MEMBERS_CAN_VIEW",
        "whoCanViewMembership": "ALL_MANAGERS_CAN_VIEW"
      };



/**
 *  The groups to be created, including any manager (moderator)
 *  security groups
 */
const groups =
      [
/*
        //
        // Members
        //
        {
          attributes :
          {
            "name": "all-members",
            "email": "all-members@mawg.cap.gov",
            "description": `"All members of MAWG"`,
            
            "messageModerationLevel": "MODERATE_ALL_MESSAGES",
          },
          managers :
          [
            "moderators-all-members@mawg.cap.gov"
          ]
        },
        {
          attributes :
          {
            "name": "wing-members",
            "email": "wing-members@mawg.cap.gov",
            "description": `"MAWG HQ members"`
          }
        },
        {
          attributes :
          {
            "name": "boston-members",
            "email": "boston-members@mawg.cap.gov",
            "description": `"Boston Squadron members"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-members",
            "email": "bridgewater-members@mawg.cap.gov",
            "description": `"Bridgewater Squadron members"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-members",
            "email": "goddard-members@mawg.cap.gov",
            "description": `"Goddard Squadron members"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-members",
            "email": "pierce-members@mawg.cap.gov",
            "description": `"Pierce Squadron  members"`
          }
        },
        {
          attributes :
          {
            "name": "westover-members",
            "email": "westover-members@mawg.cap.gov",
            "description": `"Westover Squadron members"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-members",
            "email": "beverly-members@mawg.cap.gov",
            "description": `"Beverly Squadron members"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-members",
            "email": "worcester-members@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron members"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-members",
            "email": "hanscom-members@mawg.cap.gov",
            "description": `"Hanscom Squadron members"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-members",
            "email": "cp18-members@mawg.cap.gov",
            "description": `"CP18 members"`
          }
        },
        {
          attributes :
          {
            "name": "essex-members",
            "email": "essex-members@mawg.cap.gov",
            "description": `"Essex Composite Squadron members"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-members",
            "email": "pilgrim-members@mawg.cap.gov",
            "description": `"Pilgrim Squadron members"`
          }
        },
*/
        
        //
        // Seniors
        //
        {
          attributes :
          {
            "name": "all-seniors",
            "email": "all-seniors@mawg.cap.gov",
            "description": `"All senior members of MAWG"`,
            
            "messageModerationLevel": "MODERATE_ALL_MESSAGES",
          },
          managers :
          [
            "moderators-all-seniors@mawg.cap.gov"
          ]
        },
        {
          attributes :
          {
            "name": "wing-seniors",
            "email": "wing-seniors@mawg.cap.gov",
            "description": `"MAWG HQ senior members"`
          }
        },
        {
          attributes :
          {
            "name": "boston-seniors",
            "email": "boston-seniors@mawg.cap.gov",
            "description": `"Boston Squadron senior members"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-seniors",
            "email": "bridgewater-seniors@mawg.cap.gov",
            "description": `"Bridgewater Squadron senior members"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-seniors",
            "email": "goddard-seniors@mawg.cap.gov",
            "description": `"Goddard Squadron senior members"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-seniors",
            "email": "pierce-seniors@mawg.cap.gov",
            "description": `"Pierce Squadron  senior members"`
          }
        },
        {
          attributes :
          {
            "name": "westover-seniors",
            "email": "westover-seniors@mawg.cap.gov",
            "description": `"Westover Squadron senior members"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-seniors",
            "email": "beverly-seniors@mawg.cap.gov",
            "description": `"Beverly Squadron senior members"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-seniors",
            "email": "worcester-seniors@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron senior members"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-seniors",
            "email": "hanscom-seniors@mawg.cap.gov",
            "description": `"Hanscom Squadron senior members"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-seniors",
            "email": "cp18-seniors@mawg.cap.gov",
            "description": `"CP18 senior members"`
          }
        },
        {
          attributes :
          {
            "name": "essex-seniors",
            "email": "essex-seniors@mawg.cap.gov",
            "description": `"Essex Composite Squadron senior members"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-seniors",
            "email": "pilgrim-seniors@mawg.cap.gov",
            "description": `"Pilgrim Squadron senior members"`
          }
        },
        
/*
        //
        // Cadets
        //
        {
          attributes :
          {
            "name": "all-cadets",
            "email": "all-cadets@mawg.cap.gov",
            "description": `"All cadet members and DCCs of MAWG"`,
            
            "messageModerationLevel": "MODERATE_ALL_MESSAGES",
          },
          managers :
          [
            "moderators-all-cadets@mawg.cap.gov"
          ]
        },
        {
          attributes :
          {
            "name": "boston-cadets",
            "email": "boston-cadets@mawg.cap.gov",
            "description": `"Boston Squadron cadet members and DCCs"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-cadets",
            "email": "bridgewater-cadets@mawg.cap.gov",
            "description": `"Bridgewater Squadron cadet members and DCCs"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-cadets",
            "email": "goddard-cadets@mawg.cap.gov",
            "description": `"Goddard Squadron cadet members and DCCs"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-cadets",
            "email": "pierce-cadets@mawg.cap.gov",
            "description": `"Pierce Squadron  cadet members and DCCs"`
          }
        },
        {
          attributes :
          {
            "name": "westover-cadets",
            "email": "westover-cadets@mawg.cap.gov",
            "description": `"Westover Squadron cadet members and DCCs"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-cadets",
            "email": "beverly-cadets@mawg.cap.gov",
            "description": `"Beverly Squadron cadet members and DCCs"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-cadets",
            "email": "worcester-cadets@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron cadet members and DCCs"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-cadets",
            "email": "hanscom-cadets@mawg.cap.gov",
            "description": `"Hanscom Squadron cadet members and DCCs"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-cadets",
            "email": "cp18-cadets@mawg.cap.gov",
            "description": `"CP18 cadet members and DCCs"`
          }
        },
        {
          attributes :
          {
            "name": "essex-cadets",
            "email": "essex-cadets@mawg.cap.gov",
            "description": `"Essex Composite Squadron cadet members and DCCs"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-cadets",
            "email": "pilgrim-cadets@mawg.cap.gov",
            "description": `"Pilgrim Squadron cadet members and DCCs"`
          }
        },
*/
        
        //
        // AE
        //
        {
          attributes :
          {
            "name": "all-ae",
            "email": "all-ae@mawg.cap.gov",
            "description": `"All aerospace education officers and directors of AE"`
          }
        },
        {
          attributes :
          {
            "name": "wing-ae",
            "email": "wing-ae@mawg.cap.gov",
            "description": `"MAWG HQ Directors of AE"`
          }
        },
        {
          attributes :
          {
            "name": "boston-ae",
            "email": "boston-ae@mawg.cap.gov",
            "description": `"Boston Squadron aerospace education officers"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-ae",
            "email": "bridgewater-ae@mawg.cap.gov",
            "description": `"Bridgewater Squadron aerospace education officers"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-ae",
            "email": "goddard-ae@mawg.cap.gov",
            "description": `"Goddard Squadron aerospace education officers"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-ae",
            "email": "pierce-ae@mawg.cap.gov",
            "description": `"Pierce Squadron  aerospace education officers"`
          }
        },
        {
          attributes :
          {
            "name": "westover-ae",
            "email": "westover-ae@mawg.cap.gov",
            "description": `"Westover Squadron aerospace education officers"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-ae",
            "email": "beverly-ae@mawg.cap.gov",
            "description": `"Beverly Squadron aerospace education officers"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-ae",
            "email": "worcester-ae@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron aerospace education officers"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-ae",
            "email": "hanscom-ae@mawg.cap.gov",
            "description": `"Hanscom Squadron aerospace education officers"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-ae",
            "email": "cp18-ae@mawg.cap.gov",
            "description": `"CP18 aerospace education officers"`
          }
        },
        {
          attributes :
          {
            "name": "essex-ae",
            "email": "essex-ae@mawg.cap.gov",
            "description": `"Essex Composite Squadron aerospace education officers"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-ae",
            "email": "pilgrim-ae@mawg.cap.gov",
            "description": `"Pilgrim Squadron aerospace education officers"`
          }
        },
      ];


// Create each of the mailing lists
groups.forEach(
  (config) =>
  {
    createGroup(extend(
      CONFIG_DEFAULT,
      config.attributes));
  });
