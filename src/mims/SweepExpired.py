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
# 05Jan25 MEG helpmsg now includes default lookback days.
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

class SweepExpired( Manager ):
    """
    SweepExpired is intended as a maintenance function.  It's purpose is to
    scan the Member collection for old memberships that have expired, but not
    been removed or marked as EXMEMBER and mark them, records are purged
    from the Google collection depending on the state of the DELETE_PURGED
    configuration option. The default lookback period is 30 days beyond
    LOOKBACK + GRACE unless argv[2] contains an integer value.

    SweepExpired creates a job file to delete any accounts found in the Google
    collection as a precaution.  This may fail if the account has already
    been deleted, but it's a small price to pay for security.
    """

    helpMsg = 'Maintenance: purge expired members not already removed, args: [lookback days (' + str(LOOKBACK+GRACE) + ')]'

    is_a_job = True
    
    def __init__( self ):
        super().__init__()
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.INFO )
        # build up query for use in run()
        try:
            look_back_days = int( sys.argv[ 2 ] )
        except ( IndexError, ValueError ) as e:
            look_back_days = LOOKBACK + GRACE + 30
        # compute look back date
        today = datetime.today()
        # number of days beyond which to consider account removal
        start_date = today - timedelta( days = look_back_days )
        self.query = {'Expiration' : { '$lte' : start_date }}

    def run( self ):
        """
        Run the query against the Member collection and mark
        select documents as EXMEMBERs.
        """
        if DEBUG:
            print( f"{self.__class__.__name__}:{sys._getframe().f_code.co_name}()" )

        purgeList = []
        cursor = self.DB().Member.find( self.query )
        for member in cursor:
            if ( self.checkHolds( member[ 'CAPID' ] )): continue
            if ( member[ 'MbrStatus' ] != 'EXMEMBER' ):
                self.markEXMEMBER( member[ 'CAPID' ] )
                logging.info("Member: %d marked EXMEMBER in database.",
                             member[ 'CAPID' ] )
                # delete Google account record if one exists
                g = self.DB().Google.find_one(
                    { 'customSchemas.Member.CAPID' : member['CAPID'] } )
                if ( g ):
                    purgeList.append( 'gam delete user "{}"'.format(
                        g['primaryEmail'].replace("''", "'")))
                    if ( DELETE_PURGED ):
                        self.DB().Google.delete_one( { '_id': g[ '_id' ] } )
                        logging.info( "Member: %d Purged from Google: %s",
                                      member[ 'CAPID' ],
                                      DELETE_PURGED )
        if ( len( purgeList ) > 0 ):
            with open( self.outfileName, 'w' ) as outfile:
                [ print( gamcmd, file = outfile ) for gamcmd in purgeList ]
