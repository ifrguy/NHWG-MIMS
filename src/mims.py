#!/usr/bin/python3

# Maps CAP squadron/unit to Google organization path
orgUnitPath = {
    0:"/000 - New Hampshire Wing",
    1:"/001 - New Hampshire Wing",
    10:"/010 - Portsmouth Squadron",
    14:"/014 - Lebanon Squadron",
    16:"/016 - Nashua Squadron",
    32:"/032 - Concord Squadron",
    37:"/037 - Highlanders Squadron - Rochester",
    53:"/053 - Monadnock Squadron - Keene",
    54:"/054 - Manchester Squadron",
    56:"/056 - Hawk Squadron - Laconia",
    75:"/075 - Whitefield",
    801:"/801 - Humphrey Squadron - Nashua Cadets",
}

"""
MIMS - Member Information Management System.
       Google account synchronization between National and NH Wing.
       MIMS uses a combintation of MongoDB, Python, and the GAMADV-X
       Google Account Management tool.

History:
05Jun17 MEG Added suspend for expired members.
28May17 MEG Created.
"""
import os, sys
import datetime
import logging
import pymongo
from pymongo import *

class Manager(object):
    """
    Manager is the super class/factory for all jobs to be done. Manager
    doesn't really do anything but maintain a list of jobs and the context
    for all jobs, i.e. MongoDB database connection, etc.

    Manager is a factory class.  It manages and returns subclasses that
    actually do the work, like adding new members to the rolls, or removing
    members that have fallen off the rolls.
    """
    __client = MongoClient()
    __DB = __client.NHWG
    __TS = ""  # Global timestamp for file naming
    def __init__( self ):
        self.myName = 'Manager'
        self.myJobs = []
        for c in type(self).__subclasses__():
            self.myJobs.append( c.__name__ )
        __TS = datetime.datetime.now().strftime("%Y%m%dT%H%M")
        self.logfileName = self.name() + __TS + ".log"
        self.outfileName = self.name() + __TS + ".job"

    def DB(self):
        """
        Returns the current MongoDB object.
        """
        return self.__DB

    def jobs( self ):
        """
        Returns a list of all known jobs, AKA my subclasses
        """
        return myJobs

    def name( self ):
        """
        Returns the name of the class.
        """
        return myName

    def Job(self, job):
        """
        Job creates the requested subclass that does a particular job.
        The caller requests a job by sending the classes name string as
        the arguement 'job'.  Job returns the appropriate subclass instance,
        if the requested job cannot be found self is returned.
        """
        if job in self.myJobs:
            return globals()[ job ]()   # create a new Manager job subclass
        return self

class AddMembers( Manager ):
    """
    AddMembers - scans the Member collection for active senior, cadet and patron
    members.  It then checks the Google collection to see if the member
    has an account on the wing Google system.  If the user is not found
    a new Google wing account GAM command is generated and added to a
    batch job file for later execution.
    """
    myName = 'AddMembers'
    def __init__():
        super().__init__()
        self.query = { "$or":[{'Type':'SENIOR'},{'Type':'CADET'},{'Type':'PATRON'}], "$and":[ {'MbrStatus':'ACTIVE'}] }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

        def run():
    """
    Runs the MongoDB query to find all new members and produce the job
    batch file to create new member Google accounts.
    """
    cur = self.DB().Member.find( self.query )
    with open( self.outfileName, 'w' ) as outfile:
        for m in cur:
            g = self.DB().Google.find_one( {'externalIds':{'$elemMatch':{'value':m['CAPID']}}} )
            if ( g == None ):
                logging.info( "%s %d %s %s %s", "New:",
                              m[ 'CAPID' ],m[ 'NameFirst' ],
                              m[ 'NameLast' ],
                              "" if ( m[ 'NameSuffix' ] == None )
                              else m[ 'NameSuffix' ] )
                print( "gamx create user",
                       str( m[ 'CAPID' ] ) + "@nhwg.cap.gov",
                       file = outfile )

class RemoveMembers( Manager ):    
    """
    RemoveUsers job - scans the Google user account collection by externalID
    i.e. CAPID and checks to see if the member is on the CAP rolls, if not
    a GAM command is generated to delete the user account from Google, and 
    the command is added to a batch file for latter execution.
    """
    myName = 'RemoveMembers'
    def __init__():
        super().__init__()
        self.query = { 'externalIds':{'$elemMatch':{'value':{'$ne':None}}}}
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

    def run():
    """
    Runs the MongoDB query to find all members in Google not currently
    on the CAP rolls and produces a batch file to remove those member
    accounts using the GAM utility .
    """
    l = []  # list of members to remove
    g = self.DB().Google.find( self.query )
        for i in g:
            capid = i['externalIds'][0]['value']
            m = self.DB().Member.find_one({'CAPID':capid})
            if m == None: # member nolonger on rolls
                l.append( i[ 'primaryEmail' ] )
        l.sort()
        for j in l:
            print( "gamx user delete", j )

class Expired( Factory ):
    """
    Expired scans the Member collection for members whose membership
    has expired and issues a GAM command to suspend the users Wing
    account.
    """
    myName = 'Expired'
    def __init__( self ):
        super().__init__()
        self.query = { 'MbrStatus':'EXPIRED'] }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

    def run( self ):
        """
        Runs a query against the Member collection looking for expired
        members, if found issues a GAM command to suspend the Wing user
        Google account.  The account is NOT deleted and may be reactivated
        by any sys admin.
        """
        cur = self.DB().Member.find( self.query )
        with open( self.outfileName, 'w' ) as outfile:
            for m in cur:
                g = self.DB().Google.find_one(
                    {'externalIds':{'$elemMatch':{'value':m[ 'CAPID' ]}}} )
                if ( g != None ):
                    logging.info( "%s %d %s %s %s", "Suspended:",
                                  m[ 'CAPID' ], m[ 'NameFirst' ],
                                  m[ 'NameLast' ],
                                  "" if ( m[ 'NameSuffix' ] == None )
                                  else m[ 'NameSuffix' ] )
                    print( "gamx suspend user",
                           g[ 'primaryEmail' ], file = outfile )
    
def main():
    """
    Main - MIMS produces a stream of GAM commands to create, remove or 
    suspend users as a batch file.  The batch file can then be scheduled
    to run at a later time.
    """
    # Logging on/off to stderr
    LOGGING = os.environ.get( 'LOGGING' )
    # Create the base factory object
    MIMS = Manager()

    job = MIMS( sys.argv[1] )
    job.run()


###########################################
#
#       Invoke main function
#
###########################################
if __name__ == "__main__" :
    sys.exit( main() )
