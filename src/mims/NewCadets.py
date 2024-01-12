# -*- mode: Python; coding: utf-8 -*-
## Copyright 2023 Marshall E. Giguere
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

# History:
# 10Dec23 MEG Module version
# 28May17 MEG Original MIMS created.

import os, sys, string, random
import logging
import pymongo
from datetime import date, timedelta, datetime, timezone
from pymongo import *
import re
from bson.regex import Regex

# MIMS specific
from config.mims_conf import *
from config.credentials import *
from mims.version import *
from mims.Manager import *
from mims.NewMembers import *

class NewCadets( NewMembers ):
    """
    Scans the Member table for Cadet members not having Google accounts.
    Makes a new account if the cadet member is active and is MIN_CADET_AGE or over.
    If you desire all cadets to have accounts simply set MIN_CADET_AGE to some
    low value and setting CREATE_CADET_ACCOUNTS to True.
    """
    helpMsg = f"Create wing accounts for Cadet members {MIN_CADET_AGE} yrs or older."

    is_a_job = True

    def __init__( self ):
        super().__init__()
        self.groups = CADETGROUPS
        self.newbies = CADET_NEWBIES
        self.newbieGroup = CADET_NEWBIE_GROUP
        y = datetime.utcnow().year - MIN_CADET_AGE
        m = datetime.utcnow().month
        qd = datetime( y, m, 1, tzinfo=timezone.utc)
        self.query = { 'Type':'CADET',
                       'MbrStatus':'ACTIVE',
                       'DOB': { u'$lte' : qd }
        }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

    def run(self):
        """
        Create Cadet accounts if enabled.
        Account creation restricted by MIN_CADET_AGE.
        """
        if DEBUG:
            print( f"{self.__class__.__name__}:{sys._getframe().f_code.co_name}()" )

        if ( CREATE_CADET_ACCOUNTS ):
            super().run()
        else:
            print('Cadet account creation is not enabled.')
            logging.warning('Cadet account creation is not enabled.')
        return
