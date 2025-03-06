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

#
# Display the MIMS help page
#
# History:
# 25Dec23 MEG Jobs displayed sorted.
# 10Dec23 MEG Module version
# 28May17 MEG Original MIMS created.

import os, sys, string, random
import logging
import pymongo
from datetime import date, timedelta, datetime, timezone
from pymongo import *
import re
from bson.regex import Regex

from config.mims_conf import *
from config.credentials import *
from mims.version import *
#import mims.Manager
from mims.Manager import Manager

class help( Manager ):
    """
    Prints a help page showing usage, version and available jobs.
    """
    helpMsg = 'Prints this page.'

    is_a_job = True
    
    def __init__( self ):
        super().__init__()

    def run( self ):
        """
        Print help.
        """
        print( f"Usage: {sys.argv[0]} <job> [arg ...]" )
        print( f"Version: {VERSION}" )
        print( f"Database: {MIMS_DB}" )
        print( 'Available jobs:' )
        # Produce a sorted list of jobs
        for k in sorted( self.jobs(), key=str.casefold ):
            j = self.myJobs[ k ]
            print( f"{j.__name__} - {j.helpMsg}" )
