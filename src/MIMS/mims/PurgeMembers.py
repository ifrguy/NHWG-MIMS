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
from datetime import date, timedelta, datetime, timezone
from pymongo import *
import re
from bson.regex import Regex

# MIMS specific
from config.mims_conf import *
from config.credentials import *
from mims.version import *
from mims.Manager import *

class PurgeMembers( Manager ):    
    """
    Scans the Google user account collection by customSchemsas.Member.CAPID
    i.e. CAPID and checks to see if the member is on the CAP rolls, if not
    a GAM commands are generated to list all of the members files, delete
    the user account from Google.

    NOTE: two batch jobs are created. The first prefixed by "FileList"
    produces a listing files owned by each member.  The second file prefixed
    by "PurgeMembers" contains the actual commands to delete the users.  THIS
    FILE IS PUT ON HOLD by default, and will not execute.  The administrator
    must examine member files and determine if they are to be kept or just
    deleted.  The admin may then transfer the entire member drive to the
    another member using the gam user <old user> transfer drive <new user>
    command.  The admin must take the purge job off of hold status and run it.
    """

    helpMsg = "Remove accounts of members no longer on CAP rolls,\n job placed on hold for review, creates file listing job."

    is_a_job = True
    
    def __init__(self):
        super().__init__()
        # look back date
        self.lookback = datetime.utcnow() - timedelta( days=LOOKBACK + GRACE )
        self.outfileName = JobFilePath + 'hold-' + self.name() + self.TS() + ".job"
        self.query = { 'Expiration': {'$lte': self.lookback },
                       'CAPID' : { '$gt' : 99999 } }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.INFO )

    def writePurge( self, list ):
        """
        Write a GAM batch job file to purge members.
        """
        gamcmdfmt = 'gam {} user {}'
        if ( len( list ) > 0 ):
             with open( self.outfileName, 'w' ) as outfile:
                 for j in list:
                     print( gamcmdfmt.format( PURGE_ACTION, j ),
                       file = outfile )

        logging.info( "Accounts to purge: %d", len( list ))

        return

    def writeGetFiles( self, list ):
        """
        Write a GAM batch job file to list all of a members files.
        Files should be examined before and moved prior to purging
        the member.
        """
        if len( list ) == 0 : return # if empty skip making file
        gamcmdfmt = 'gam user {} print filelist fields "title"'
        filename = JobFilePath + 'FileList' + self.TS() + '.job'
        with open( filename, 'w' ) as ofile:
            for j in list:
                print( gamcmdfmt.format( j ),
                       file = ofile )
        return

    def run(self):
        """
        Pulls all members whose membership has been expired for more
        than GRACE days beyond LOOKBACK days or more, if true
        the account is removed and the member is marked as an EXMEMBER.
        Checks to see if member is on the Holds list before issuing purge.

        NOTE: The resulting gam purge job is placed in the
        hold state until released by the operator.  In addition a gam job
        to list all files owned by users is produced.
        """
        if DEBUG:
            print( f"{self.__class__.__name__}:{sys._getframe().f_code.co_name}()" )

        l = []  # list of members to remove
        #Scan all expired members
        cur = self.DB().Member.find( self.query )
        for m in cur:
            capid = m['CAPID']
            g = self.DB().Google.find_one(
                {'customSchemas.Member.CAPID': capid } )
            if ( g == None ): continue
            if ( self.checkHolds( capid )):
                logging.info('HOLD: %d %s, account: %s',
                             capid, g['name']['fullName'],
                             g['primaryEmail'] )
                continue
            l.append( g['primaryEmail'] )
            try:
                logging.info( "Remove: %d %s", capid,
                              g['name']['fullName'])
            except KeyError as e:
                logging.error( f"DB: {MIMS_DB}: document ID: {g['_id']}, collection: Google" )
                logging.error( f"KeyError: {e} no such key." )
                logging.error( "This is possibly a place holder document for a new account not yet created." )
                continue


            # Mark member as Ex-member
            self.markEXMEMBER( m['CAPID'] )
            # delete Google user record from Google collection
            if ( DELETE_PURGED ):
                self.DB().Google.delete_one({'_id': g['_id']})

        l.sort()
        # generate the purge job
        self.writePurge( l )
        # generate job to list purged members files for examination
        self.writeGetFiles( l )
        return
