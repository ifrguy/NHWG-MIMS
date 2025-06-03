#!/usr/bin/env python3
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

"""
MIMS - Member Information Management System.

       Google account synchronization between National and NH Wing.
       MIMS uses a combintation of MongoDB, Python, and the GAMADV-X
       Google Account Management tool. Requires Workspace admin privileges.

History:
07Dec24 DJL Consolidate configuration files for single point changes.
09Dec23 MEG Modularized base on mims version 2.0.11.
10May17 MEG Original MIMS created.
"""
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
from mims.Manager import *
from mims.help import *
from mims.NewMembers import *
from mims.NewSeniors import *
from mims.NewCadets import *
from mims.Expired import *
from mims.PurgeMembers import *
from mims.UnSuspend import *
from mims.SweepExpired import *
from mims.CheckGoogle import *
from mims.version import *

def main():
# Instantiate the Manager and initialize the jobs list
    if DEBUG : print( "Create MIMS Manager object." )
    MIMS = Manager()
    if DEBUG: print( f"Post __init__ Jobs: {MIMS.jobs()}" )
    if DEBUG: print( f"Timestamp: {MIMS.TS()}" )
    if DEBUG: print( f"Database connection: {MIMS.DB()}" )
# check for no job on command line
    if DEBUG : print( f"Cmd args: {sys.argv}" )
    if ( len(sys.argv) < 2 ):
        MIMS.job( 'help' ).run()
        MIMS.close()
        return 0

# All good try to run job        
    if DEBUG : print( f"Cmd arg: {sys.argv[1]}" )
    job = MIMS.job( sys.argv[1] )
    if DEBUG : print( f"Run job: {job.name()}" )
    job.run()
    if DEBUG : print( "Close" )
    MIMS.close()
    if DEBUG : print( "Exit" )
###########################################
#
#       Invoke main function
#
###########################################


if __name__ == "__main__" :
    sys.exit( main() )
