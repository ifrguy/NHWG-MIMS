"""
MIMS Configuration File
"""
## Copyright 2017 Marshall E. Giguere
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
MIMS_DB = 'NHWG'

# Maps CAP operational squadron/unit to Google organization path
orgUnitPath = {
    '000':"/000 - New Hampshire Wing",
    '001':"/001 - New Hampshire Wing",
    '010':"/010 - Portsmouth Squadron",
    '014':"/014 - Lebanon Squadron",
    '016':"/016 - Nashua Squadron",
    '032':"/032 - Concord Squadron",
    '037':"/037 - Highlanders Squadron - Rochester",
    '053':"/053 - Monadnock Squadron - Keene",
    '054':"/054 - Manchester Squadron",
    '056':"/056 - Hawk Squadron - Laconia",
    '075':"/075 - Whitefield",
    '801':"/801 - 801 - Humphrey Squadron - ASD Nashua Cadets",
    '999':"/999 - State Legislators",
}

# Cadet account creation control
CREATE_CADET_ACCOUNTS = True
# Minimun age at which Cadets are premitted to have accounts
MIN_CADET_AGE = 18

# Default group strings
# May be a string of comma separated group email addresses, e.g. "all,cadets"
# Default cadet groups
CADETGROUPS = 'all'
# Default senior member groups
SENIORGROUPS = 'all,seniors'

# Domain to be used when creating, deleting accounts or groups
DOMAIN = 'nhwg.cap.gov'

# Domain calendar ID
# This is the wing level calendar everyone should see it.
# Put you domain wide calerdar ID (email address in this variable).
# You will find this by looking the calendar settings for the particular
# calendar.
DOMAIN_CALENDAR = None

# Grace period. The number of days beyond the LOOKBACK after which member
# accounts will be purged
GRACE = 30

# Look Back period - how many days back to start considering expired members
# for suspend
LOOKBACK = 31

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
# newbie group email addresses
NEWBIE_GROUP = ''
CADET_NEWBIE_GROUP = None

# Add seniors to the newbie group
SENIOR_NEWBIES = True

# Add cadets to the newbie group
CADET_NEWBIES = False
