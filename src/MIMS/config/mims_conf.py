"""
MIMS Configuration File
"""
## Copyright 2025 Marshall E. Giguere
##
##   Licensed under the Apache License, Version 2.0 (the "License");
##   you may not use this file except in compliance with the License.
##   You may obtain a copy of the License at
##
##       https://www.apache.org/licenses/LICENSE-2.0
##
##   Unless required by applicable law or agreed to in writing, software
##   distributed under the License is distributed on an "AS IS" BASIS,
##   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
##   See the License for the specific language governing permissions and
##   limitations under the License.


# Mongo DB host options
MIMS_HOST = 'localhost'
MIMS_PORT = 27017
# Database name
MIMS_DB = <Your Wing here, e.g NHWG>

# Maps CAP operational squadron/unit to Google organization path (ou)
# This is a sample showing how to set up your organization units ou's
orgUnitPath = {
    '000':"/000 - Patron and inactive members",
    '001':"/001 - My Wing Name",
    '002':"/002 - Aerospace Education Members",
    '010':"/010 - Some city Squadron",
    '999':"/999 - State Legislators",
}

# Domain to be used when creating, deleting accounts or groups
DOMAIN = '<your_wing_domain>.cap.gov'

# Cadet account creation control
CREATE_CADET_ACCOUNTS = True

# Minimun age at which Cadets are premitted to have accounts.
# If you want all your cadets to have accounts set this to a low number.
MIN_CADET_AGE = 18

# Default group strings
# NOTE: By default Google tracks all user accounts in the
# "allusers@nhwg.cap.gov" group as the domain customer id is
# the only member.  If you wish to change this behaviour
# remove the "unknown" member from the allusers group.  You will then
# need to add the "allusers" group to the lists.
# May be a string of comma separated group email addresses, e.g. "all,cadets"

# Default list of cadet groups
CADETGROUPS = None

# Default list of senior member groups
# add your senior member groups email address(es) here as a
# comman separeted, quoted string: e.g. "seniors@mywing.cap.gov"
SENIORGROUPS = None

# Domain calendar ID List
# This is the wing level calendar(s) everyone should see it.
# Put your domain wide calerdar ID's (email address(es) in this list).
# You will find this by looking the calendar settings for the particular
# calendar.
# Add each calendar Id, email that you want added to new users calendars
# This is a example.
DOMAIN_CALENDARS = [
    'my_wing_event_calendar_7438206@calendars.google.com',
    'my_wing_internal_calendar_adiAdvh97_ij@calendars.google.com', 
]

# Due to the fact that Google can take up to "24 hours" to create a user account
# attempting to immediately, or almost immediately add a calendar to a recently
# created user may fail with the error "user does not exist", even when Google
# reports completion.  In order to obviate that to some degree a delay
# can be included at the top of the calendar add job file.
# The delay is in seconds.  This is done only once per job file.
CALENDAR_ADD_DELAY = 20

# Grace period. The number of days beyond the LOOKBACK after which member
# accounts will be purged LOOKBACK + GRACE >= 90.
# These timing are due to eServices practices.  
GRACE = 76

# Look Back period - how many days back to start considering expired members
# for suspend
LOOKBACK = 14

# Default action, create placeholder Google accounts in the Google collection
# MIMS normally creates a placeholder account to prevent subesquent
# account creations from creating duplicates.
# NOTE: you should only turn this off for DEBUGGING or TESTING.
GOOGLE_PLACEHOLDER_ACCOUNT = True

# Default action for Expired members: suspend|delete
EXPIRED_ACTION = 'suspend'

# Default action for ex-member accounts, no longer on eServices rolls
PURGE_ACTION = 'delete'

# Flag to remove purged members from the Google collection
DELETE_PURGED=False

# These paths tell MIMS where to save output .job files
LogFilePath = "./log/"
JobFilePath = "./job/"

# if true update the user record in local MongoDB Google collection
UPDATE_SUSPEND = False

# Welcome message template file path relaitve to ./job
# May also include a flag to tell gam this is a HTML file by adding "html true"
# to the tail of file spec.
WELCOMEMSG = "./new-user-email-template.html html true"

# New members groups
# These are groups to which new members current primary email will be added.
# newbie group addresses
# If you want to communicate with new members a "newbie" group can be used
# Include the email address for the newbie groups here, then enable the groups
# below.
NEWBIE_GROUP = 'newbie@nhwg.cap.gov'
CADET_NEWBIE_GROUP = 'newbie@nhwg.cap.gov'

# Add seniors to the newbie group
SENIOR_NEWBIES = False

# Add cadets to the newbie group
CADET_NEWBIES = False
