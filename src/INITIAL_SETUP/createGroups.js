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
 *  The groups to be created
 */
const groups =
      [
        //
        // Public announcements
        //
        {
          attributes :
          {
            "name": "public-announce",
            "email": "public-announce@mawg.cap.gov",
            "description": `"Open to the public, and all members of MAWG"`,
            "messageModerationLevel": "MODERATE_ALL_MESSAGES",
          }
        },
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
          }
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
          }
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
          }
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

        //
        // AEM
        //
        {
          attributes :
          {
            "name": "all-aem",
            "email": "all-aem@mawg.cap.gov",
            "description": `"All aerospace education members"`
          }
        },

        //
        // AP
        //
        {
          attributes :
          {
            "name": "all-ap",
            "email": "all-ap@mawg.cap.gov",
            "description": `"All airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "wing-ap",
            "email": "wing-ap@mawg.cap.gov",
            "description": `"MAWG HQ airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "boston-ap",
            "email": "boston-ap@mawg.cap.gov",
            "description": `"Boston Squadron airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-ap",
            "email": "bridgewater-ap@mawg.cap.gov",
            "description": `"Bridgewater Squadron airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-ap",
            "email": "goddard-ap@mawg.cap.gov",
            "description": `"Goddard Squadron airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-ap",
            "email": "pierce-ap@mawg.cap.gov",
            "description": `"Pierce Squadron  airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "westover-ap",
            "email": "westover-ap@mawg.cap.gov",
            "description": `"Westover Squadron airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-ap",
            "email": "beverly-ap@mawg.cap.gov",
            "description": `"Beverly Squadron airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-ap",
            "email": "worcester-ap@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-ap",
            "email": "hanscom-ap@mawg.cap.gov",
            "description": `"Hanscom Squadron airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-ap",
            "email": "cp18-ap@mawg.cap.gov",
            "description": `"CP18 airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "essex-ap",
            "email": "essex-ap@mawg.cap.gov",
            "description": `"Essex Composite Squadron airborne photographers"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-ap",
            "email": "pilgrim-ap@mawg.cap.gov",
            "description": `"Pilgrim Squadron airborne photographers"`
          }
        },

        //
        // Aircrew
        //
        {
          attributes :
          {
            "name": "all-aircrew",
            "email": "all-aircrew@mawg.cap.gov",
            "description": `"All aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "wing-aircrew",
            "email": "wing-aircrew@mawg.cap.gov",
            "description": `"MAWG HQ aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "boston-aircrew",
            "email": "boston-aircrew@mawg.cap.gov",
            "description": `"Boston Squadron aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-aircrew",
            "email": "bridgewater-aircrew@mawg.cap.gov",
            "description": `"Bridgewater Squadron aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-aircrew",
            "email": "goddard-aircrew@mawg.cap.gov",
            "description": `"Goddard Squadron aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-aircrew",
            "email": "pierce-aircrew@mawg.cap.gov",
            "description": `"Pierce Squadron  aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "westover-aircrew",
            "email": "westover-aircrew@mawg.cap.gov",
            "description": `"Westover Squadron aircrew"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-aircrew",
            "email": "beverly-aircrew@mawg.cap.gov",
            "description": `"Beverly Squadron aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-aircrew",
            "email": "worcester-aircrew@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-aircrew",
            "email": "hanscom-aircrew@mawg.cap.gov",
            "description": `"Hanscom Squadron aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-aircrew",
            "email": "cp18-aircrew@mawg.cap.gov",
            "description": `"CP18 aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "essex-aircrew",
            "email": "essex-aircrew@mawg.cap.gov",
            "description": `"Essex Composite Squadron aircrew"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-aircrew",
            "email": "pilgrim-aircrew@mawg.cap.gov",
            "description": `"Pilgrim Squadron aircrew"`
          }
        },

        //
        // Instructor pilots
        //
        {
          attributes :
          {
            "name": "all-cfi",
            "email": "all-cfi@mawg.cap.gov",
            "description": `"All instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "wing-cfi",
            "email": "wing-cfi@mawg.cap.gov",
            "description": `"MAWG HQ instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "boston-cfi",
            "email": "boston-cfi@mawg.cap.gov",
            "description": `"Boston Squadron instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-cfi",
            "email": "bridgewater-cfi@mawg.cap.gov",
            "description": `"Bridgewater Squadron instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-cfi",
            "email": "goddard-cfi@mawg.cap.gov",
            "description": `"Goddard Squadron instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-cfi",
            "email": "pierce-cfi@mawg.cap.gov",
            "description": `"Pierce Squadron  instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "westover-cfi",
            "email": "westover-cfi@mawg.cap.gov",
            "description": `"Westover Squadron instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-cfi",
            "email": "beverly-cfi@mawg.cap.gov",
            "description": `"Beverly Squadron instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-cfi",
            "email": "worcester-cfi@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-cfi",
            "email": "hanscom-cfi@mawg.cap.gov",
            "description": `"Hanscom Squadron instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-cfi",
            "email": "cp18-cfi@mawg.cap.gov",
            "description": `"CP18 instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "essex-cfi",
            "email": "essex-cfi@mawg.cap.gov",
            "description": `"Essex Composite Squadron instructor pilots"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-cfi",
            "email": "pilgrim-cfi@mawg.cap.gov",
            "description": `"Pilgrim Squadron instructor pilots"`
          }
        },

        //
        // Commanders
        //
        {
          attributes :
          {
            "name": "all-commanders",
            "email": "all-commanders@mawg.cap.gov",
            "description": `"All commanders"`
          }
        },
        {
          attributes :
          {
            "name": "wing-commanders",
            "email": "wing-commanders@mawg.cap.gov",
            "description": `"MAWG HQ commanders"`
          }
        },
        {
          attributes :
          {
            "name": "boston-commanders",
            "email": "boston-commanders@mawg.cap.gov",
            "description": `"Boston Squadron commanders"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-commanders",
            "email": "bridgewater-commanders@mawg.cap.gov",
            "description": `"Bridgewater Squadron commanders"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-commanders",
            "email": "goddard-commanders@mawg.cap.gov",
            "description": `"Goddard Squadron commanders"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-commanders",
            "email": "pierce-commanders@mawg.cap.gov",
            "description": `"Pierce Squadron  commanders"`
          }
        },
        {
          attributes :
          {
            "name": "westover-commanders",
            "email": "westover-commanders@mawg.cap.gov",
            "description": `"Westover Squadron commanders"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-commanders",
            "email": "beverly-commanders@mawg.cap.gov",
            "description": `"Beverly Squadron commanders"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-commanders",
            "email": "worcester-commanders@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron commanders"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-commanders",
            "email": "hanscom-commanders@mawg.cap.gov",
            "description": `"Hanscom Squadron commanders"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-commanders",
            "email": "cp18-commanders@mawg.cap.gov",
            "description": `"CP18 commanders"`
          }
        },
        {
          attributes :
          {
            "name": "essex-commanders",
            "email": "essex-commanders@mawg.cap.gov",
            "description": `"Essex Composite Squadron commanders"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-commanders",
            "email": "pilgrim-commanders@mawg.cap.gov",
            "description": `"Pilgrim Squadron commanders"`
          }
        },

        //
        // Directors
        //
        {
          attributes :
          {
            "name": "wing-directors",
            "email": "wing-directors@mawg.cap.gov",
            "description": `"MAWG HQ directors"`
          }
        },

        //
        // Incident commanders
        //
        {
          attributes :
          {
            "name": "all-ic",
            "email": "all-ic@mawg.cap.gov",
            "description": `"All incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "wing-ic",
            "email": "wing-ic@mawg.cap.gov",
            "description": `"MAWG HQ incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "boston-ic",
            "email": "boston-ic@mawg.cap.gov",
            "description": `"Boston Squadron incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-ic",
            "email": "bridgewater-ic@mawg.cap.gov",
            "description": `"Bridgewater Squadron incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-ic",
            "email": "goddard-ic@mawg.cap.gov",
            "description": `"Goddard Squadron incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-ic",
            "email": "pierce-ic@mawg.cap.gov",
            "description": `"Pierce Squadron  incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "westover-ic",
            "email": "westover-ic@mawg.cap.gov",
            "description": `"Westover Squadron incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-ic",
            "email": "beverly-ic@mawg.cap.gov",
            "description": `"Beverly Squadron incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-ic",
            "email": "worcester-ic@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-ic",
            "email": "hanscom-ic@mawg.cap.gov",
            "description": `"Hanscom Squadron incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-ic",
            "email": "cp18-ic@mawg.cap.gov",
            "description": `"CP18 incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "essex-ic",
            "email": "essex-ic@mawg.cap.gov",
            "description": `"Essex Composite Squadron incident commanders"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-ic",
            "email": "pilgrim-ic@mawg.cap.gov",
            "description": `"Pilgrim Squadron incident commanders"`
          }
        },

        //
        // IT
        //
        {
          attributes :
          {
            "name": "all-it",
            "email": "all-it@mawg.cap.gov",
            "description": `"All IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "wing-it",
            "email": "wing-it@mawg.cap.gov",
            "description": `"MAWG HQ IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "boston-it",
            "email": "boston-it@mawg.cap.gov",
            "description": `"Boston Squadron IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-it",
            "email": "bridgewater-it@mawg.cap.gov",
            "description": `"Bridgewater Squadron IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-it",
            "email": "goddard-it@mawg.cap.gov",
            "description": `"Goddard Squadron IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-it",
            "email": "pierce-it@mawg.cap.gov",
            "description": `"Pierce Squadron  IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "westover-it",
            "email": "westover-it@mawg.cap.gov",
            "description": `"Westover Squadron IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-it",
            "email": "beverly-it@mawg.cap.gov",
            "description": `"Beverly Squadron IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-it",
            "email": "worcester-it@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-it",
            "email": "hanscom-it@mawg.cap.gov",
            "description": `"Hanscom Squadron IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-it",
            "email": "cp18-it@mawg.cap.gov",
            "description": `"CP18 IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "essex-it",
            "email": "essex-it@mawg.cap.gov",
            "description": `"Essex Composite Squadron IT (Information Technology)"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-it",
            "email": "pilgrim-it@mawg.cap.gov",
            "description": `"Pilgrim Squadron IT (Information Technology)"`
          }
        },

        //
        // Logistics
        //
        {
          attributes :
          {
            "name": "all-logistics",
            "email": "all-logistics@mawg.cap.gov",
            "description": `"All Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "wing-logistics",
            "email": "wing-logistics@mawg.cap.gov",
            "description": `"MAWG HQ Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "boston-logistics",
            "email": "boston-logistics@mawg.cap.gov",
            "description": `"Boston Squadron Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-logistics",
            "email": "bridgewater-logistics@mawg.cap.gov",
            "description": `"Bridgewater Squadron Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-logistics",
            "email": "goddard-logistics@mawg.cap.gov",
            "description": `"Goddard Squadron Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-logistics",
            "email": "pierce-logistics@mawg.cap.gov",
            "description": `"Pierce Squadron  Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "westover-logistics",
            "email": "westover-logistics@mawg.cap.gov",
            "description": `"Westover Squadron Logistics"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-logistics",
            "email": "beverly-logistics@mawg.cap.gov",
            "description": `"Beverly Squadron Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-logistics",
            "email": "worcester-logistics@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-logistics",
            "email": "hanscom-logistics@mawg.cap.gov",
            "description": `"Hanscom Squadron Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-logistics",
            "email": "cp18-logistics@mawg.cap.gov",
            "description": `"CP18 Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "essex-logistics",
            "email": "essex-logistics@mawg.cap.gov",
            "description": `"Essex Composite Squadron Logistics"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-logistics",
            "email": "pilgrim-logistics@mawg.cap.gov",
            "description": `"Pilgrim Squadron Logistics"`
          }
        },

        //
        // Mission staff
        //
        {
          attributes :
          {
            "name": "all-missionstaff",
            "email": "all-missionstaff@mawg.cap.gov",
            "description": `"All mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "wing-missionstaff",
            "email": "wing-missionstaff@mawg.cap.gov",
            "description": `"MAWG HQ mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "boston-missionstaff",
            "email": "boston-missionstaff@mawg.cap.gov",
            "description": `"Boston Squadron mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-missionstaff",
            "email": "bridgewater-missionstaff@mawg.cap.gov",
            "description": `"Bridgewater Squadron mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-missionstaff",
            "email": "goddard-missionstaff@mawg.cap.gov",
            "description": `"Goddard Squadron mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-missionstaff",
            "email": "pierce-missionstaff@mawg.cap.gov",
            "description": `"Pierce Squadron  mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "westover-missionstaff",
            "email": "westover-missionstaff@mawg.cap.gov",
            "description": `"Westover Squadron mission staff"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-missionstaff",
            "email": "beverly-missionstaff@mawg.cap.gov",
            "description": `"Beverly Squadron mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-missionstaff",
            "email": "worcester-missionstaff@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-missionstaff",
            "email": "hanscom-missionstaff@mawg.cap.gov",
            "description": `"Hanscom Squadron mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-missionstaff",
            "email": "cp18-missionstaff@mawg.cap.gov",
            "description": `"CP18 mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "essex-missionstaff",
            "email": "essex-missionstaff@mawg.cap.gov",
            "description": `"Essex Composite Squadron mission staff"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-missionstaff",
            "email": "pilgrim-missionstaff@mawg.cap.gov",
            "description": `"Pilgrim Squadron mission staff"`
          }
        },

        //
        // Public affairs
        //
        {
          attributes :
          {
            "name": "all-pa",
            "email": "all-pa@mawg.cap.gov",
            "description": `"All Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "wing-pa",
            "email": "wing-pa@mawg.cap.gov",
            "description": `"MAWG HQ Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "boston-pa",
            "email": "boston-pa@mawg.cap.gov",
            "description": `"Boston Squadron Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-pa",
            "email": "bridgewater-pa@mawg.cap.gov",
            "description": `"Bridgewater Squadron Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-pa",
            "email": "goddard-pa@mawg.cap.gov",
            "description": `"Goddard Squadron Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-pa",
            "email": "pierce-pa@mawg.cap.gov",
            "description": `"Pierce Squadron  Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "westover-pa",
            "email": "westover-pa@mawg.cap.gov",
            "description": `"Westover Squadron Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-pa",
            "email": "beverly-pa@mawg.cap.gov",
            "description": `"Beverly Squadron Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-pa",
            "email": "worcester-pa@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-pa",
            "email": "hanscom-pa@mawg.cap.gov",
            "description": `"Hanscom Squadron Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-pa",
            "email": "cp18-pa@mawg.cap.gov",
            "description": `"CP18 Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "essex-pa",
            "email": "essex-pa@mawg.cap.gov",
            "description": `"Essex Composite Squadron Public Affairs officers"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-pa",
            "email": "pilgrim-pa@mawg.cap.gov",
            "description": `"Pilgrim Squadron Public Affairs officers"`
          }
        },

        //
        // Pilots
        //
        {
          attributes :
          {
            "name": "all-pilots",
            "email": "all-pilots@mawg.cap.gov",
            "description": `"All pilots"`
          }
        },
        {
          attributes :
          {
            "name": "wing-pilots",
            "email": "wing-pilots@mawg.cap.gov",
            "description": `"MAWG HQ pilots"`
          }
        },
        {
          attributes :
          {
            "name": "boston-pilots",
            "email": "boston-pilots@mawg.cap.gov",
            "description": `"Boston Squadron pilots"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-pilots",
            "email": "bridgewater-pilots@mawg.cap.gov",
            "description": `"Bridgewater Squadron pilots"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-pilots",
            "email": "goddard-pilots@mawg.cap.gov",
            "description": `"Goddard Squadron pilots"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-pilots",
            "email": "pierce-pilots@mawg.cap.gov",
            "description": `"Pierce Squadron  pilots"`
          }
        },
        {
          attributes :
          {
            "name": "westover-pilots",
            "email": "westover-pilots@mawg.cap.gov",
            "description": `"Westover Squadron pilots"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-pilots",
            "email": "beverly-pilots@mawg.cap.gov",
            "description": `"Beverly Squadron pilots"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-pilots",
            "email": "worcester-pilots@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron pilots"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-pilots",
            "email": "hanscom-pilots@mawg.cap.gov",
            "description": `"Hanscom Squadron pilots"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-pilots",
            "email": "cp18-pilots@mawg.cap.gov",
            "description": `"CP18 pilots"`
          }
        },
        {
          attributes :
          {
            "name": "essex-pilots",
            "email": "essex-pilots@mawg.cap.gov",
            "description": `"Essex Composite Squadron pilots"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-pilots",
            "email": "pilgrim-pilots@mawg.cap.gov",
            "description": `"Pilgrim Squadron pilots"`
          }
        },

        //
        // Safety officers
        //
        {
          attributes :
          {
            "name": "all-safety",
            "email": "all-safety@mawg.cap.gov",
            "description": `"All Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "wing-safety",
            "email": "wing-safety@mawg.cap.gov",
            "description": `"MAWG HQ Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "boston-safety",
            "email": "boston-safety@mawg.cap.gov",
            "description": `"Boston Squadron Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-safety",
            "email": "bridgewater-safety@mawg.cap.gov",
            "description": `"Bridgewater Squadron Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-safety",
            "email": "goddard-safety@mawg.cap.gov",
            "description": `"Goddard Squadron Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-safety",
            "email": "pierce-safety@mawg.cap.gov",
            "description": `"Pierce Squadron  Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "westover-safety",
            "email": "westover-safety@mawg.cap.gov",
            "description": `"Westover Squadron Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-safety",
            "email": "beverly-safety@mawg.cap.gov",
            "description": `"Beverly Squadron Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-safety",
            "email": "worcester-safety@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-safety",
            "email": "hanscom-safety@mawg.cap.gov",
            "description": `"Hanscom Squadron Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-safety",
            "email": "cp18-safety@mawg.cap.gov",
            "description": `"CP18 Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "essex-safety",
            "email": "essex-safety@mawg.cap.gov",
            "description": `"Essex Composite Squadron Safety officers"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-safety",
            "email": "pilgrim-safety@mawg.cap.gov",
            "description": `"Pilgrim Squadron Safety officers"`
          }
        },

        //
        // PD
        //
        {
          attributes :
          {
            "name": "all-pd",
            "email": "all-pd@mawg.cap.gov",
            "description": `"All education and training (professional development) officers and directors"`
          }
        },
        {
          attributes :
          {
            "name": "wing-pd",
            "email": "wing-pd@mawg.cap.gov",
            "description": `"MAWG HQ Directors of professional development"`
          }
        },
        {
          attributes :
          {
            "name": "boston-pd",
            "email": "boston-pd@mawg.cap.gov",
            "description": `"Boston Squadron education and training (professional development) officers"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-pd",
            "email": "bridgewater-pd@mawg.cap.gov",
            "description": `"Bridgewater Squadron education and training (professional development) officers"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-pd",
            "email": "goddard-pd@mawg.cap.gov",
            "description": `"Goddard Squadron education and training (professional development) officers"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-pd",
            "email": "pierce-pd@mawg.cap.gov",
            "description": `"Pierce Squadron  education and training (professional development) officers"`
          }
        },
        {
          attributes :
          {
            "name": "westover-pd",
            "email": "westover-pd@mawg.cap.gov",
            "description": `"Westover Squadron education and training (professional development) officers"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-pd",
            "email": "beverly-pd@mawg.cap.gov",
            "description": `"Beverly Squadron education and training (professional development) officers"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-pd",
            "email": "worcester-pd@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron education and training (professional development) officers"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-pd",
            "email": "hanscom-pd@mawg.cap.gov",
            "description": `"Hanscom Squadron education and training (professional development) officers"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-pd",
            "email": "cp18-pd@mawg.cap.gov",
            "description": `"CP18 education and training (professional development) officers"`
          }
        },
        {
          attributes :
          {
            "name": "essex-pd",
            "email": "essex-pd@mawg.cap.gov",
            "description": `"Essex Composite Squadron education and training (professional development) officers"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-pd",
            "email": "pilgrim-pd@mawg.cap.gov",
            "description": `"Pilgrim Squadron education and training (professional development) officers"`
          }
        },

        //
        // Parents
        //
        {
          attributes :
          {
            "name": "boston-parents",
            "email": "boston-parents@mawg.cap.gov",
            "description": `"Boston Squadron Parents officers"`
          }
        },
        {
          attributes :
          {
            "name": "bridgewater-parents",
            "email": "bridgewater-parents@mawg.cap.gov",
            "description": `"Bridgewater Squadron Parents officers"`
          }
        },
        {
          attributes :
          {
            "name": "goddard-parents",
            "email": "goddard-parents@mawg.cap.gov",
            "description": `"Goddard Squadron Parents officers"`
          }
        },
        {
          attributes :
          {
            "name": "pierce-parents",
            "email": "pierce-parents@mawg.cap.gov",
            "description": `"Pierce Squadron  Parents officers"`
          }
        },
        {
          attributes :
          {
            "name": "westover-parents",
            "email": "westover-parents@mawg.cap.gov",
            "description": `"Westover Squadron Parents officers"`
          }
        },
        {
          attributes :
          {
            "name": " beverly-parents",
            "email": "beverly-parents@mawg.cap.gov",
            "description": `"Beverly Squadron Parents officers"`
          }
        },
        {
          attributes :
          {
            "name": "worcester-parents",
            "email": "worcester-parents@mawg.cap.gov",
            "description": `"Worcester Cadet Squadron Parents officers"`
          }
        },
        {
          attributes :
          {
            "name": "hanscom-parents",
            "email": "hanscom-parents@mawg.cap.gov",
            "description": `"Hanscom Squadron Parents officers"`
          }
        },
        {
          attributes :
          {
            "name": "cp18-parents",
            "email": "cp18-parents@mawg.cap.gov",
            "description": `"CP18 Parents officers"`
          }
        },
        {
          attributes :
          {
            "name": "essex-parents",
            "email": "essex-parents@mawg.cap.gov",
            "description": `"Essex Composite Squadron Parents officers"`
          }
        },
        {
          attributes :
          {
            "name": "pilgrim-parents",
            "email": "pilgrim-parents@mawg.cap.gov",
            "description": `"Pilgrim Squadron Parents officers"`
          }
        },
*/
      ];


// Create each of the mailing lists
groups.forEach(
  (config) =>
  {
    createGroup(extend(
      CONFIG_DEFAULT,
      config.attributes));
  });
