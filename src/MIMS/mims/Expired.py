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
# 13Nov25 MEG Now includes a Google account sign out for additionl security.
# 23Jan25 MEG NHWGStatus DB field renamed to WingStatus.
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

class Expired( Manager ):
    """
    Expired scans the Member collection for members whose membership
    has expired LOOKBACK or more days ago and issues a GAM command
    to suspend the users Wing account.  In addition user's email is remvoved
    from the Google Global Address List (GAL).
    """

    helpMsg = f"Suspend accounts of users whose CAP memberships have expired by more than {LOOKBACK} days."

    is_a_job = True

    def __init__( self ):
        super().__init__()
        today = datetime.today()
        expired = today - timedelta( days = LOOKBACK )
        self.query = { 'Expiration' : { '$lte': expired },
                       'CAPID' : { '$gt' : 99999 } }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.INFO )

    def run( self ):
        """
        Runs a query against the Member collection looking for expired
        members, if found issues a GAM command to suspend the Wing user
        Google account.  Only accounts that have expired more than LOOKBACK
        days are considered for suspension.  The account is NOT deleted
        and may be reactivated by any sys admin.
        """
        outputCmds = []  # the list of gam cmds to output
        gamcmdfmt = "gam {} user {}"
        gamSuspendCmdFmt = "gam update user {} suspended on gal off"
        gamSignOutCmdFmt = "gam user {} signout"
        if DEBUG:
            print( f"{self.__class__.__name__}:{sys._getframe().f_code.co_name}()" )

        cur = self.DB().Member.find( self.query ).sort('CAPID',
                                                       pymongo.ASCENDING)
        # Look for expired memberships
        for m in cur:
            # Check if member is on hold status
            if ( self.checkHolds( m['CAPID'] )): continue
            # Check if member is already an EXMEMBER
            try:
                if ( m['WingStatus'] == "EXMEMBER" ): continue
            except KeyError as e:
                if ( m['MbrStatus'] == 'EXMEMBER' ): continue

            g = self.DB().Google.find_one(
                {'customSchemas.Member.CAPID': m['CAPID']} )
            if ( g ):
                if ( g[ 'suspended' ] ): continue # already suspended
                if ( EXPIRED_ACTION == 'delete' ):
                    outputCmds.append( gamcmdfmt.format( EXPIRED_ACTION,
                                                         g[ 'primaryEmail' ]))
                    logging.info( "Delete: %d %s %s %s %s %s", 
                                  m[ 'CAPID' ],
                                  m[ 'NameFirst' ],
                                  m[ 'NameLast' ],
                                  m[ 'NameSuffix' ],
                                  m[ 'Type' ],
                                  g[ 'primaryEmail' ] )

                else:
                    outputCmds.append( gamSignOutCmdFmt.format( g[ 'primaryEmail' ] ))
                    outputCmds.append( gamSuspendCmdFmt.format( g[ 'primaryEmail' ] ))
                    logging.info( "Suspend: %d %s %s %s %s %s", 
                                  m[ 'CAPID' ],
                                  m[ 'NameFirst' ],
                                  m[ 'NameLast' ],
                                  m[ 'NameSuffix' ],
                                  m[ 'Type' ],
                                  g[ 'primaryEmail' ] )
# Generate job file
        if ( len( outputCmds) > 0 ):
            with open( self.outfileName, 'w' ) as outfile:
                [ print( cmd, file = outfile ) for cmd in outputCmds ]
        logging.info( "Accounts suspended: %d", len( outputCmds) )
        return
