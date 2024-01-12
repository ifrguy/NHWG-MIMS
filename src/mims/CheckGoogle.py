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
from pymongo import *
import re
from bson.regex import Regex

# MIMS specific
from config.mims_conf import *
from config.credentials import *
from mims.version import *
from mims.Manager import *

class CheckGoogle ( Manager ):
    """
    CheckGoogle - Class for reconciling eServices and Google with respect to Org Unit Path and Member Type
          (This combines the CheckMemberType and CheckOrgUnit classes into one.)
    """
    helpMsg = 'Maintenance: sync Google account (OU, Unit & Member type) to CAPWatch.'

    is_a_job = True
    
    def __init__(self):
        super().__init__()
        self.domain = DOMAIN

        # MongoDB aggregation (for Google collection):
        self.query = [
        # Stage 0: we just care about 'real' CAPIDs (those > 100000)
            {
               "$match" : {
                   "customSchemas.Member.CAPID" : {
                       "$gt" : 100000
                    }
                }
            }, 
        # Stage 1: join on CAPID from Member collection
            {
               "$lookup" : {
                  "from" : "Member",
                  "localField" : "customSchemas.Member.CAPID",
                  "foreignField" : "CAPID",
                  "as" : "memberInfo"
                 }
            }, 
        # Stage 2: unwind all the memberInfo fields
            {
               "$unwind" : {
                   "path" : "$memberInfo"
                }
            }, 
        # Stage 3: project results and keep only the following fields:
            {
               "$project" : {
                  "Gid" : "$customSchemas.Member.CAPID",
                  "primaryEmail" : "$primaryEmail",
                  "orgUnit" : "$orgUnitPath",
                  "GUnit" : "$customSchemas.Member.Unit",
                  "CUnit" : "$memberInfo.Unit",
                  "mType" : "$memberInfo.Type",
                  "gType" : "$customSchemas.Member.Type"
               }
            }
        ]

        #
        logging.basicConfig( filename = self.logfileName, filemode = 'w', level = logging.DEBUG )

    def run(self):
        if DEBUG:
            print( f"{self.__class__.__name__}:{sys._getframe().f_code.co_name}()" )

        # Perform a "join" to get overlap of Google and CAPWATCH entries based on CAPID
        # (Note that we execute the aggregation on the Google collection, but could have just
        # as easily designed an aggregation on the Member collection:)
        result = self.DB().Google.aggregate( self.query)

        # In case we want to track number of individual differences we find:
        nOrgChanges = 0 # number of orgUnit modifications
        nMemberTypeChanges = 0 # number of MemberType modifications

        # Iterate over result, looking first for differing orgUnit, then for differing MemberType:
        # (Only write to file if we actually have updates)
        gamCmdList = []
        for m in result:
           # Act on those records for which the Member.Unit from Google does not equal the Unit from CAPWATCH:
           if ( m[ 'GUnit' ] != m[ 'CUnit' ] ):
               # Ah, but only proceed for those members NOT in unit '000' (** do we want this? **)
               if ( m[ 'CUnit' ] != '000' ):
                   nOrgChanges += 1
                   logging.info("The Unit is different for CAPID [%d] %s versus %s", m['Gid'], m['GUnit'], m['CUnit'])
                   # Add gam update command to our list:
                   gamCmdList.append('gam update user {} orgUnitPath \"{}\" Member.Unit \"{}\"'.format( m['primaryEmail'], orgUnitPath[ m[ 'CUnit' ] ], m[ 'CUnit' ]))

           # Now look for differing Member Types:
           if ( m[ 'gType' ] != m[ 'mType' ] ):
               nMemberTypeChanges += 1
               logging.info("The member type for CAPID [%s] has changed from %s to %s", m['Gid'], m['gType'], m['mType'])
               # Add gam update command to our list:
               gamCmdList.append('gam update user {} Member.Type \"{}\" '.format( m['primaryEmail'], m['mType']))
               
        # If we have any gam update commands in our list, write them to the file:
        if (len(gamCmdList) > 0) :
            with open (self.outfileName, 'w' ) as outfile:
                [ print (c, file = outfile) for c in gamCmdList ]
