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
MIMSUSER = 'MIMS'
MIMSPASS = '********'

# Default action for Expired members
EXPIRED_ACTION = 'suspend'

# Default action for ex-members, no longer on eSerives rolls
PURGE_ACTION = 'suspend'

# Flag to remove purged members from NHWG.Google collection
DELETE_PURGED=False

# Where to save output
LogFilePath = "./log/"
JobFilePath = "./job/"

# Welcome message template file path
WELCOMEMSG = "./email-template.txt"
