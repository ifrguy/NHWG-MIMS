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

class ExpiredV2( Manager ):
    """
    Expired scans the Google collection, joined with the Member
    and Holds collections, for accounts whose membership is not found
    or has expired LOOKBACK or more days ago and issues a GAM command
    to suspend the users Wing account. In addition user's email is
    remvoved from the Google Global Address List (GAL).
    """
    
    helpMsg = f"Suspend accounts of users whose CAP memberships have expired by more than {LOOKBACK} days."
    
    is_a_job = True
    
    def __init__( self ):
        super().__init__()
        today = datetime.today()
        self.expired = today - timedelta( days = LOOKBACK )
        self.outfileName = JobFilePath + 'hold-' + self.name() + self.TS() + ".job"
        print("Outfile=" + self.outfileName)
        self.query = [
            {
                "$match":
                {
	            "suspended": False
                }
            },
            {
                "$lookup":
                {
                    "from" : "Member",
                    "localField" : "customSchemas.Member.CAPID",
                    "foreignField" : "CAPID",
                    "as" : "member"
                }
            },
            {
                "$unwind":
                {
	            "path" : "$member",
	            "preserveNullAndEmptyArrays" : True
                }
            },
            {
                "$lookup":
                {
                    "from" : "Holds",
                    "localField" : "customSchemas.Member.CAPID",
                    "foreignField" : "CAPID",
                    "as" : "hold"
                }
            },
            {
                "$unwind":
                {
	            "path" : "$hold",
	            "preserveNullAndEmptyArrays" : True
                }
            },
            {
                "$project":
                {
	            "_id" : 0,
	            "primaryEmail" : 1,
	            "CAPID" : "$customSchemas.Member.CAPID",
	            "Type" : "$customSchemas.Member.Type",
	            "Unit" : "$customSchemas.Member.Unit",
                    "name" : "$name.fullName",
	            "lastLogin" : "$lastLoginTime",
	            "expiration" : "$member.Expiration",
	            "hold" : "$hold.CAPID"
                }
            }
        ]
        
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
        if DEBUG:
            print( f"{self.__class__.__name__}:{sys._getframe().f_code.co_name}()" )

        cur = self.DB().Google.aggregate( self.query )

        # Look for and remove accounts with expired memberships or
        # no member info at all, that aren't otherwise marked to
        # prevent removing them.
        for m in cur:
            # Check whether member is on hold status.
            try:
                if ( m['hold'] ): continue
            except KeyError as e:
                pass

            # Check whether this account is expired.
            try:
                if ( m['expiration'] > self.expired ): continue
            except KeyError as e:
                pass

            # Check whether this is a valid CAPID
            try:
                if ( m['CAPID'] < 100000 ): continue
            except KeyError as e:
                m['CAPID'] = -1

            # Check whether this is an internal
            # (admin-specified) account.
            try:
                if ( m['Type'] == "INTERNAL" ): continue
            except KeyError as e:
                m['Type'] = "None"

            # Fix double apostrophes created during import
            m['primaryEmail'] = m['primaryEmail'].replace("''", "'")

            if ( EXPIRED_ACTION == 'delete' ):
                try:
                    outputCmds.append( "# {} {} {} {}".format(
                        m[ 'CAPID' ],
                        m[ 'name' ],
                        m[ 'Type' ],
                        m[ 'expiration' ] ))
                except KeyError as e:
                    outputCmds.append( "# {} {} {}".format(
                        m[ 'CAPID' ],
                        m[ 'name' ],
                        m[ 'Type' ] ))

                outputCmds.append( "gam {} user {}\n".format( EXPIRED_ACTION,
                                                            m[ 'primaryEmail' ]))
                try:
                    logging.info( "Delete: %d %s %s %s", 
                                  m[ 'CAPID' ],
                                  m[ 'name' ],
                                  m[ 'Type' ],
                                  m[ 'expiration' ])
                except KeyError as e:
                    logging.info( "Delete: %d %s %s", 
                                  m[ 'CAPID' ],
                                  m[ 'name' ],
                                  m[ 'Type' ] )

            else:
                try:
                    outputCmds.append( "# {} {} {} {}".format(
                        m[ 'CAPID' ],
                        m[ 'name' ],
                        m[ 'Type' ],
                        m[ 'expiration' ] ))
                except KeyError as e:
                    outputCmds.append( "# {} {} {}".format(
                        m[ 'CAPID' ],
                        m[ 'name' ],
                        m[ 'Type' ] ))

                outputCmds.append( "gam update user {} suspended on gal off\n".format( m[ 'primaryEmail' ] ))
                try:
                    logging.info( "Suspend: %d %s %s %s", 
                                  m[ 'CAPID' ],
                                  m[ 'name' ],
                                  m[ 'Type' ],
                                  m[ 'expiration' ])
                except KeyError as e:
                    logging.info( "Suspend: %d %s %s", 
                                  m[ 'CAPID' ],
                                  m[ 'name' ],
                                  m[ 'Type' ] )
                    
        # Generate job file
        if ( len( outputCmds) > 0 ):
            with open( self.outfileName, 'w' ) as outfile:
                [ print( cmd, file = outfile ) for cmd in outputCmds ]
                logging.info( "Accounts suspended/deleted: %d", len( outputCmds) )
            return
