# -*- mode: Python; coding: utf-8 -*-
## Copyright 2024 Marshall E. Giguere
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
# 18Feb24 MEG Force account creation when CAPID list supplied.
# 16Feb24 MEG NewCadets: force cadet account creation with list of CAP ID's.
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

    As a convenience you can force cadet account creation by supplying a
    comman separated list of CAP ID's e.g. 111111,222222...
    """
    helpMsg = f"Create cadet accounts, min age: {MIN_CADET_AGE}. Optional force creation: CAPID[,CAPID...]"

    is_a_job = True

    def __init__( self ):
        super().__init__()
        self.groups = CADETGROUPS
        self.newbies = CADET_NEWBIES
        self.newbieGroup = CADET_NEWBIE_GROUP
        y = datetime.utcnow().year - MIN_CADET_AGE
        m = datetime.utcnow().month
        qd = datetime( y, m, 1, tzinfo=timezone.utc)
        # Check for list of cadet CAPID's, if none default to normal processing.
        try:
            self.query = { 'Type':'CADET',
                           'MbrStatus':'ACTIVE',
                           'CAPID': { u'$in': [int(i) for i in sys.argv[ 2 ].split(',')] }
                          }
            # force cadet account creation to make it happen
            CREATE_CADET_ACCOUNTS = True
        except ValueError as e:
            print("ERROR: not a valid CAPID:", e.args[0].split(': ')[1] )
            sys.exit( 1 )
        except IndexError as e:
            # Default cadet account creation query
            self.query = { 'Type':'CADET',
                           'MbrStatus':'ACTIVE',
                           'DOB': { u'$lt' : qd }
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
