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


# Read the configuration file
import json
with open('config.json') as f:
  CONFIGURATION = json.load(f)

# Internal-use variables
# See config.json for comments documenting each of these
MIMS_HOST               = CONFIGURATION.mongoDb.host
MIMS_PORT               = CONFIGURATION.mongoDb.port
MIMS_DB                 = CONFIGURATION.mongoDb.db
orgUnitPath             = CONFIGURATION.orgUnit
CREATE_CADET_ACCOUNTS   = CONFIGURATION.createCadetAccounts
MIN_CADET_AGE           = CONFIGURATION.minCadetAge
CADETGROUPS             = CONFIGURATION.cadetGroups
SENIORGROUPS            = CONFIGURATION.seniorGroups
DOMAIN                  = CONFIGURATION.domain
DOMAIN_CALENDAR         = CONFIGURATION.domainCalendar
GRACE                   = CONFIGURATION.grace
LOOKBACK                = CONFIGURATION.lookBack
EXPIRED_ACTION          = CONFIGURATION.expiredAction
PURGE_ACTION            = CONFIGURATION.purgeAction
DELETE_PURGED           = CONFIGURATION.deletePurged
LogFilePath             = CONFIGURATION.logFilePath
JobFilePath             = CONFIGURATION.jobFilePath
UPDATE_SUSPEND          = CONFIGURATION.updateSuspend
WELCOMEMSG              = CONFIGURATION.welcomeMessage
NEWBIE_GROUP            = CONFIGURATION.newbieGroup
CADET_NEWBIE_GROUP      = CONFIGURATION.cadetNewbieGroup
SENIOR_NEWBIES          = CONFIGURATION.seniorNewbies
CADET_NEWBIES           = CONFIGURATION.cadetNewbies
DEBUG                   = CONFIGURATION.debug
