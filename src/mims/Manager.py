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
# 02Aug24 MEG Set pymongo log level to ERROR only due logging change in 4.8.0
# 10Dec23 MEG Module version
# 28May17 MEG Original MIMS created.

"""
MIMS - Member Information Management System.

       Google account synchronization between National and NH Wing.
       MIMS uses a combintation of MongoDB, Python, and the GAMADV-X
       Google Account Management tool. Requires Workspace admin privileges.
"""
import os, sys, string, random
import logging
import pymongo
from datetime import date, timedelta, datetime, timezone
from pymongo import *
import re
from bson.regex import Regex

from config.config import *
from config.mims_conf import *
from config.credentials import *
from mims.version import *

class Manager(object):
    """
    Manager is the super class/factory for all jobs to be done. Manager
    doesn't really do anything but maintain a list of jobs and the context
    for all jobs, i.e. MongoDB database connection, etc.

    Manager is a factory class.  It returns instances of subclasses that
    actually do the work, like adding new members to the rolls, or removing
    members that have fallen off the rolls.

    Subclasses are generally considered as "jobs" unless they declare
    "is_a_job" False, or are derived from a class a class that does. It is
    probably best that "job" classes declare "is_a_job" True for safety,
    and consistency.
    """
    helpMsg = 'Top level'

    # logger debug level set here to keep pymonog from spewing its guts
    # in the log files.  Due to logging changes in PyMongo 4.8
    logging.getLogger('pymongo').setLevel(logging.ERROR)

    __client = MongoClient( host=MIMS_HOST, port=MIMS_PORT,
                            username=MIMSUSER, password=MIMSPASS,
                            authSource=MIMS_DB)
    __DB = __client[ MIMS_DB ]
    __TS = datetime.now().strftime("%Y%m%dT%H%M")
    myJobs = {}
    def __init__( self ):

        if DEBUG : print( f"Log file path: {LogFilePath}" )
        if DEBUG : print( f"Job file path: {JobFilePath}" )

        __TS = datetime.now().strftime("%Y%m%dT%H%M")
        self.logfileName = LogFilePath + self.name() + self.TS() + ".log"
        self.outfileName = JobFilePath + self.name() + self.TS() + ".job"
        self.register_jobs( self.__class__ )
        
    def register_jobs( self, cls ):
        """
        Recurses down the class tree and builds a list of all
        subclasses (jobs).  Subclass names are the functions that
        can be performed by MIMS. "Jobs" are added to the list if they
	are flagged as "is_a_job".
        """
        for sub in cls.__subclasses__():
            if DEBUG: print("Class:",sub.__name__,
                  "is job:",
                  getattr(sub, 'is_a_job', False ))
            isJob = getattr( sub, 'is_a_job', False )
            if isJob:
                if DEBUG: print("Register job:",sub.__name__,"to jobs list." )
                self.myJobs[sub.__name__] = sub
                if DEBUG: print("myJobs:", self.myJobs)

            self.register_jobs( sub )

    def DB(self):
        """
        Returns the current MongoDB object.
        """
        return self.__DB

    def close( self ):
        self.__client.close()

    def checkHolds( self, capid ):
        """
        Check to see if member account is on hold and not to be removed
        or otherwise changed.
        Returns the held document, or None if not found in Holds.
        """
        return self.DB().Holds.find_one({'CAPID':capid})

    def jobs( self ):
        """
        Returns a list of all known jobs, AKA my subclasses
        """
        return self.myJobs

    def markEXMEMBER( self, capid ):
        """
        Marks the Member record for  capid as an EXMEMBER.
        """
        self.DB().Member.update_one( { 'CAPID' : capid },
                                     { '$set' : { 'MbrStatus' : 'EXMEMBER',
                                                  'NHWGStatus' : 'EXMEMBER' }})
    def name( self ):
        """
        Returns the name of the class.
        """
        return self.__class__.__name__

    @classmethod
    def TS( cls ):
        """
        Returns classes timestamp string.
        """
        return cls.__TS
    
    def job(self, job):
        """
        Job creates the requested subclass that does a particular job.
        The caller requests a job by sending the classes name string as
        the arguement 'job'.  Job returns the appropriate subclass instance,
        if the requested job cannot be found KEYERROR is intercepted
        the help text is printed and the program exits.
        """
        try:
            return self.myJobs[ job ]()   # create subclass job instance
        except (TypeError, KeyError) as e:
            print( f"ERROR: no such job: {e}" )
            print( 'Available jobs:' )
            # Produce a sorted list of jobs
            for k in sorted( self.jobs(), key=str.casefold ):
                j = self.myJobs[ k ]
                print( f"{j.__name__} - {j.helpMsg}" )
            self.close()
            sys.exit( 1 )

