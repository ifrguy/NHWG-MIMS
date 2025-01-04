"""
MIMS Configuration File
"""
## Copyright 2025 Marshall E. Giguere
##
##   Licensed under the Apache License, Version 2.0 (the "License");
##   you may not use this file except in compliance with the License.
##   You may obtain a copy of the License at
##
##       http://www.apache.org/licenses/LICENSE-2.0
##
##   Unless required by applicable law or agreed to in writing, software
##   distributed under the License is distributed on an "AS IS" BASIS,
##   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
##   See the License for the specific language governing permissions and
##   limitations under the License.


# Mongo DB host options
MIMS_HOST = 'localhost'
MIMS_PORT = 27017
MIMS_DB = 'MyWING'  # the name of your wing database

# Maps CAP operational squadron/unit to Google organization path
orgUnitPath = {
    '000':"/000 - Retired-Patrons",
    '001':"/001 - Domain top level",
    '002':"/002 - Next lower unit",
}

# Cadet account creation control
CREATE_CADET_ACCOUNTS = True
# Minimun age at which Cadets are premitted to have accounts
MIN_CADET_AGE = 18

# Default group strings
# May be a string of comma separated group email addresses, e.g. "all,cadets"
# Default cadet groups
CADETGROUPS = 'all'

# Default senior member groups, comma separated list of groups as a string
SENIORGROUPS = 'seniors@example.com'

# Domain to be used when creating, deleting accounts or groups
DOMAIN = 'example.com'

# Domain calendar ID List
# This is the wing level calendar(s) everyone should see it.
# Put your domain wide calerdar ID's (email address(es) in this list).
# You will find this by looking the calendar settings for the particular
# calendar.
DOMAIN_CALENDARS = []

# Grace period. The number of days beyond the LOOKBACK after which member
# accounts will be purged
GRACE = 76

# Look Back period - how many days back to start considering expired members
# for suspend
LOOKBACK = 14

# Default action, create placeholder Google accounts in the Google collection
# MIMS normally creates a placeholder account to prevent subesquent
# account creations from creating duplicates.
# NOTE: you should only turn this off for DEBUGGING or TESTING.
GOOGLE_PLACEHOLDER_ACCOUNT = True

# Default action for Expired members: delete|suspend
EXPIRED_ACTION = 'suspend'

# Default action for ex-members, no longer on eServices rolls
PURGE_ACTION = 'delete'

# Flag to remove purged members from NHWG.Google collection
DELETE_PURGED=True

# Where to save output
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
NEWBIE_GROUP = 'newbies@example.com'
CADET_NEWBIE_GROUP = None

# Add seniors to the newbie group
SENIOR_NEWBIES = True

# Add cadets to the newbie group
CADET_NEWBIES = False
