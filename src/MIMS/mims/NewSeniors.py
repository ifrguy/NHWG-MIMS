# -*- mode: Python; coding: utf-8 -*-
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

# History:
# 10Dec23 MEG Module version
# 28May17 MEG Original MIMS created.

import os, sys, string, random
import logging
import pymongo
from pymongo import *
import re
from bson.regex import Regex

# MIMS specific
from config.mims_conf import *
from config.credentials import *
from mims.version import *
from mims.Manager import *
from mims.NewMembers import *

class NewSeniors( NewMembers ):
    """
    Scans the Member table for Senior members not having Google accounts.
    Make a new account if the senior member is active, add to senior mailing
    list.
    """
    helpMsg = 'Create wing accounts for new Senior members.'

    is_a_job = True
    
    def __init__( self ):
        super().__init__()
        self.groups = SENIORGROUPS
        self.newbies = SENIOR_NEWBIES
        self.newbieGroup = NEWBIE_GROUP
        self.query = { 'Type':'SENIOR',
                       'MbrStatus':'ACTIVE',
                       'Unit' : { '$ne' : '000' }  }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.INFO )

