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

class UnSuspend( Manager ):
    """
    UnSuspend scans Google documents for suspended accounts and checks
    them against the Member document to see if the member has renewed and is
    ACTIVE again, if so the account is unsuspended. Members in the Hold
    collection are ignored.
    """

    helpMsg = 'Reactivate wing accounts for renewed members.'

    is_a_job = True
        
    def __init__( self ):
        super().__init__()
        self.query = { 'suspended' : True }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

    def run( self ):
        """
        Scans Google account documents for suspended accounts. Checks account
        against the Member document to see if the member is active again by
        looking at the expiration date. Emit a GAM command to unsuspend the
        account on Google Workspace if active.
        Note: Member.Type == ROLE accounts are exempt, and manually managed.
        """
        outputCmds = []  #array of gam commands to output
        gamcmdfmt = 'gam update user "{}" suspended off gal on'
        today = datetime.today()
        if DEBUG:
            print( f"{self.__class__.__name__}:{sys._getframe().f_code.co_name}()" )
               
        cur = self.DB().Google.find( self.query )

        for g in cur:
            try:
                # ROLE accounts are ignored, manually managed by admin
                if ( re.match( 'role',
                               g[ 'customSchemas' ][ 'Member' ][ 'Type' ],
                               re.I )): continue
            except KeyError as e:
                pass
            try:
                # lookup user in Member documents
                m = self.DB().Member.find_one(
                    { 'CAPID' : g[ 'customSchemas']['Member']['CAPID'] }
                )
            except KeyError as e:
                logging.warning("WARNING::UnSuspend:run: Missing or corrupt customSchema in Google collection at: _id: %s, primaryEmail: %s SKIPPED",
                                g['_id'],
                                g['primaryEmail'] )
                continue
            if ( m ) :
                # Fix double apostrophes created during import
                fixedEmail = m['primaryEmail'].replace("''", "'")

                # check to see if member is on the Holds list and skip
                if ( self.checkHolds( m['CAPID'] )):
                    logging.warning("Member on permanent hold CAPID: %d, Account: %s not reactivated.",
                                    m['CAPID'],
                                    fixedEmail )
                    continue
                # if membership is still expired skip reactivation
                if ( m[ 'Expiration' ] < today ):
                    continue
                # push unsuspend command to output list
                logging.info( "UNSUSPEND: %d, %s, %s, %s",
                              m['CAPID'], g['name']['fullName'],
                              fixedEmail, orgUnitPath[ m['Unit'] ] )
                outputCmds.append( gamcmdfmt.format( fixedEmail ))
                # check to see if we should update the local Google collection
                if UPDATE_SUSPEND :
                    result = self.DB().Google.update_one( { 'primaryEmail' : g['primaryEmail']},
                                                          { '$set' : { 'suspended' : False,
                                                                       'suspensionReason': '' }} )
                    if ( result[ 'nModified' ] == 0 ) :
                        logging.warning( "WARNING::UnSuspend:run:Failed to update suspended for: %s in Google collection.",
                                         g[ 'primaryEmail' ] )
    
        if ( len( outputCmds ) > 0 ):
            with open( self.outfileName, 'w' ) as outfile:
                for cmd in outputCmds:
                    print( cmd, file = outfile )
        logging.info( "Total members reactivated: %d", len( outputCmds ))
