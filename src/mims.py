#!/usr/bin/python3
## Copyright 2017 Marshall E. Giguere
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


version_tuple = (1,1,0)
VERSION = 'v{}.{}.{}'.format(version_tuple[0], version_tuple[1], version_tuple[2])
# Maps CAP operational squadron/unit to Google organization path
orgUnitPath = {
    '000':"/000 - New Hampshire Wing",
    '001':"/001 - New Hampshire Wing",
    '010':"/010 - Portsmouth Squadron",
    '014':"/014 - Lebanon Squadron",
    '016':"/016 - Nashua Squadron",
    '032':"/032 - Concord Squadron",
    '037':"/037 - Highlanders Squadron - Rochester",
    '053':"/053 - Monadnock Squadron - Keene",
    '054':"/054 - Manchester Squadron",
    '056':"/056 - Hawk Squadron - Laconia",
    '075':"/075 - Whitefield",
    '801':"/801 - Humphrey Squadron - ASD Nashua Cadets",
    '999':"/999 - State Legislators",
}

"""
MIMS - Member Information Management System.
       Google account synchronization between National and NH Wing.
       MIMS uses a combintation of MongoDB, Python, and the GAMADV-X
       Google Account Management tool. Requires G-Suite admin privileges.

History:
25Nov17 MEG Added class to unsuspend reactivated members.
25Nov17 MEG Moved login cred's from mims_conf to separate "credentials" file.
18Sep17 MEG Purge lists user files, puts purge job on hold.
31Aug17 MEG Email accounts no longer CAPID, per order of High Command.
14Jul17 MEG Added NewSeniors class, NewMembers now basically an abstract class.
09Jun17 MEG Manager scans to leaf classes for jobs, new senior mailing list updater.
07Jun17 MEG Configurable log and job file paths, separate config file.
05Jun17 MEG Added suspend for expired members.
28May17 MEG Created.
"""
import os, sys
import datetime
import logging
import pymongo
from datetime import date, timedelta
from pymongo import *
import re
from mims_conf import *
from credentials import *

class Manager(object):
    """
    Manager is the super class/factory for all jobs to be done. Manager
    doesn't really do anything but maintain a list of jobs and the context
    for all jobs, i.e. MongoDB database connection, etc.

    Manager is a factory class.  It manages and returns subclasses that
    actually do the work, like adding new members to the rolls, or removing
    members that have fallen off the rolls.
    """
    __client = MongoClient( host=MIMS_HOST, port=MIMS_PORT )
    __DB = __client[ MIMS_DB ]
    __DB.authenticate( MIMSUSER, MIMSPASS )
    __TS = datetime.datetime.now().strftime("%Y%m%dT%H%M")
    def __init__( self ):
        self.myJobs = self.allSubClasses( type( self ))
        __TS = datetime.datetime.now().strftime("%Y%m%dT%H%M")
        self.logfileName = LogFilePath + self.name() + self.TS() + ".log"
        self.outfileName = JobFilePath + self.name() + self.TS() + ".job"

    def allSubClasses( self, cls ):
        """
        Recurses down the class tree and builds a list of all
        subclasses.  Factory subclass names are the functions that
        can be performed by MIMS.
        """
        allsubs = []
        for sub in cls.__subclasses__():
            allsubs.append( sub.__name__ )
            allsubs.extend( self.allSubClasses( sub ))
        return allsubs

    def DB(self):
        """
        Returns the current MongoDB object.
        """
        return self.__DB

    def close( self ):
        self.__client.close()

    def jobs( self ):
        """
        Returns a list of all known jobs, AKA my subclasses
        """
        return self.myJobs

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
        if the requested job cannot be found self is returned. This insures
        that something runable is returned.
        """
        try:
            return globals()[ job ]()   # create subclass job 
        except KeyError as e:
            print('ERROR: no such job: ', e )
            print('Usage: ', sys.argv[0], '<job>' )
            print('Available Jobs:', self.myJobs )
            sys.exit( 1 )

class help( Manager):
    """
    Prints a help screen.
    """
    def __init__( self ):
        super().__init__()

    def run( self ):
        """
        Print help and forces exit.
        """
        print("Summary:")
        print( sys.argv[0], " <job>" )
        print( 'Version:', VERSION )
        print( "Available Jobs:",MIMS.jobs() )

        
class NewMembers( Manager ):
    """
    NewMembers - Is the base class for all member creation subclasses.
    It is intended as an abstract class containing services needed by
    subclasses to create new Google accounts.  In most cases the new member
    creation subclass will only need to declare the query needed to find
    potential members in the Member collection, and the name of the
    mailing list/group if any used by those members.

    The run method does the work of generating the commands necessary to
    create the members Gmail account and add to the mailing list supplied.
    In rare cases with special requirements a subclass may need to
    override the run method.
    """
    def __init__(self):
        super().__init__()
        self.domain = 'nhwg.cap.gov'
        # MongoDB query to find members
        self.query = None
        # GAM account creation command
        self.gamaccountfmt = 'gam create user {} externalid organization {:d} givenname "{}" familyname "{}" organizations department {} description {} primary orgunitpath "{}" password \'{}\' changepassword true'
        # GAM group add member command
        self.gamgroupfmt = 'gam update group {}@nhwg.cap.gov add member {}'
        # GAM command to email notification to new member
        self.gamnotifyfmt = ' notify {} subject "{}" message file "{}"'
        # Group to add member to
        self.group = None
        self.outfile = None
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

    def givenName( self, m ):
        """
        Input member record
        Returns firstname + middle initial
        """
        mi = ''
        if m['NameMiddle']:
            mi = ' ' + m[ 'NameMiddle' ][0]
        return m[ 'NameFirst' ] + mi

    def familyName( self, m ):
        """
        Input member record
        Returns lastname + name + suffix if any
        """
        if m[ 'NameSuffix' ]:
            return m[ 'NameLast' ] + ' ' + m[ 'NameSuffix' ]
        return  m[ 'NameLast' ]

    def getContact( self, id, type, priority ):
        """
        Return a contact record from MbrContact.
        Input: id = CAPID
               type = contact type: HOME PHONE, CELL PHONE, EMAIL...
               priority = PRIMARY, SECONDARY, EMERGENCY
        Returns: a string containing the contact. Receiver is responsible
                 for comprehension.  We don't make it we just send it.
        """
        contact = self.DB().MbrContact.find_one( {'CAPID': id,
                                                  'Type': type,
                                                  'Priority': priority })
        if contact:
            return contact[ 'Contact' ]
        else:
            return ""

    def mkename( self, nm, i ):
        """
        make non-colliding email account name string
        ckeck Google collection for primaryEmail begining with nm,
        if found offest the name and keep trying until we find
        a name that doesn't match.
        """
        if ( self.DB().Google.find_one( {'primaryEmail' :
                                         { '$regex': '/^'+nm+'/i'}} )):
            i += 1
            nm = re.sub( '[0-9]*', '', nm )  # strip trailing numbers
            return self.mkename( nm + str( i ), i )
        else:
            return nm

    def mkEmailAddress( self, m ):
        """
        Make a Google email address for member.
        Input: member record
        Output: string email address
        """
        email = (m['NameFirst'][0] + m['NameLast'] + m['NameSuffix']).lower()
        email = re.sub( '[\']', '', email )  # remove apostrophes
        email = self.mkename( email, 0 )
        return email + '@' + self.domain

    def mkNewAccount( self, m ):
        """
        Make a new member account
        Input member record.
        Output GAM member creation command to job file.
        Returns Gmail address
        Note this function never fails any failures are recorded in the log.
        """
        logging.info( "New User: %d %s %s %s Unit: %s",
                      m['CAPID'],m['NameFirst'],
                      m['NameLast'],
                      m['NameSuffix'],
                      orgUnitPath[ m[ 'Unit' ]] )
        email = self.mkEmailAddress( m )
        cmd = self.gamaccountfmt.format( email,
                                m['CAPID'],
                                self.givenName( m ),
                                self.familyName( m ),
                                m['Unit'],
                                m['Type'],
                                orgUnitPath[ m['Unit'] ],
                                self.mkpasswd( m ))
        # check for primary email to notify member
        contact = self.getContact( m['CAPID'],
                                   'EMAIL',
                                   'PRIMARY')
        if contact:
            cmd = cmd + self.gamnotifyfmt.format( contact,
                                             "Welcome to your NH Wing account",
                                             WELCOMEMSG )
            print( cmd, file = self.outfile )
        else: # do not issue account
            logging.warn( "Member: %d %s %s %s does not have a primary email address.",
                          m['CAPID'],m['NameFirst'],
                          m['NameLast'],
                          m['NameSuffix'] )
        return email

    def addToGroup( self, email ):
        """
        Add a member to a group
        Input member Google email address
        Output GAM command to add member to a mailing list/group.
        Note: this function always succeeds.
        """
        if self.group:
            groupcmd = self.gamgroupfmt.format( self.group, email  )
            logging.info( 'Member: %s added to %s mailing list.',
                          email,
                          self.group )
            print( groupcmd, file = self.outfile )
        return True
        
        
    def mkpasswd( self, m ):
        """
        Make a password for the new user m and return it.
        """
        return str(m['CAPID']) + '!' + m['NameFirst'][0]+ m['NameLast'][0]

    def run(self):
        """
        Search for new members, create account, notify and add
        member to group and appropriate mailing list.  The subclass
        must specify the query to find members.
        Note: by construction members in unit 000 or no unit
        are not considered for new accounts.
        """
        # if no query we must be abstract class we don't do anything
        if self.query == None: return
        cur = self.DB().Member.find( self.query )
        n = 0  # number of new member accounts created
        with open( self.outfileName, 'w' ) as self.outfile:
            for m in cur:
                if ( m['Unit'] not in orgUnitPath ):
                    logging.error('Unknown unit: %s, CAPID: %d no account created.',
                                  m['Unit'], m['CAPID'] )
                    continue
                # see if member has Google account
                g = self.DB().Google.find_one( {'externalIds':{'$elemMatch':{'value':m['CAPID']}}} )
                if ( g == None ): # if user does not exist make new account
                    email = self.mkNewAccount( m )
                    # add member to group mailing list if one exists
                    self.addToGroup( email )
                    n += 1

        logging.info( "New accounts created: %d", n)
        return

class NewSeniors( NewMembers ):
    """
    Scans the Member table for Senior members not having Google accounts.
    Make a new account if the senior member is active, add to senior mailing
    list.
    """
    def __init__( self ):
        super().__init__()
        self.group = 'seniors'
        self.query = { 'Type':'SENIOR',
                       'MbrStatus':'ACTIVE',
                       'Unit' : { '$ne' : '000' }  }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

class NewCadets( NewMembers ):
    """
    Scans the Member table for Cadet members not having Google accounts.
    Make a new account if the senior member is active, add to mailing
    list.
    """
    def __init__( self ):
        super().__init__()
        self.group = None
        self.query = { 'Type':'CADET','MbrStatus':'ACTIVE' }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )
    def run( self ):
        print('Cadet account creation not permitted at this time.')
        logging.warn('Cadet account creation not permitted.')
        
class PurgeMembers( Manager ):    
    """
    Scans the Google user account collection by externalID
    i.e. CAPID and checks to see if the member is on the CAP rolls, if not
    a GAM commands are generated to list all of the members files, delete
    the user account from Google.

    NOTE: two batch jobs are created. The first prefixed by "FileList"
    produces a listing files owned by each member.  The second file prefixed
    by "PurgeMembers" contains the actual commands to delete the users.  THIS
    FILE IS PUT ON HOLD by default, and will not execute.  The administrator
    must examine member files and determine if they are to be kept or just
    deleted.  The admin may then transfer the entire member drive to the
    appropriate member using the gam user <old user> transfer drive <new user>
    command.  The admin must take the purge job off of hold status and run it.
    """
    def __init__(self):
        super().__init__()
        self.outfileName = JobFilePath + 'hold-' + self.name() + self.TS() + ".job"
        self.query = { 'externalIds':{'$elemMatch':{'value':{'$gt':100000}}}}
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

    def writePurge( self, list ):
        """
        Write a GAM batch job file to purge members.
        """
        gamcmdfmt = 'gam {} user {}'
        with open( self.outfileName, 'w' ) as outfile:
            for j in list:
                print( gamcmdfmt.format( PURGE_ACTION, j ),
                       file = outfile )
        return

    def writeGetFiles( self, list ):
        """
        Write a GAM batch job file to list all of a members files.
        Files should be examined before and moved prior to purging
        the member.
        """
        if len( list ) == 0 : return # if empty skip making file
        gamcmdfmt = 'gam user {} print filelist fields "id,title,mimetype"'
        filename = JobFilePath + 'FileList' + self.TS() + '.job'
        with open( filename, 'w' ) as ofile:
            for j in list:
                print( gamcmdfmt.format( j ),
                       file = ofile )
        return

    def run(self):
        """
        Runs the MongoDB query to find all members in Google not currently
        on the CAP rolls and produces a batch file to remove those member
        accounts from Google accounts using the GAM utility, deletes users
        record from Google MongoDB, although they will be gone after the next
        Google download anyway. It's just cleaner to remove the documents for
        subsequent runs.
        """

        l = []  # list of members to remove
        n = 0 # Number of memeber accounts removed
        #Scan all Google users
        g = self.DB().Google.find( self.query )
        for i in g:
            id = i['_id']
            capid = i['externalIds'][0]['value']
            if capid == None: continue
            # Check to see if member is on no purge list and skip
            nopurge = self.DB().NoPurge.find_one({'CAPID':capid})
            if ( nopurge ):
                logging.info("Member on hold CAPID: %d, Account: %s",
                             capid,
                             i['primaryEmail'],
                             )
                continue

            m = self.DB().Member.find_one({'CAPID':capid})
            if m == None: # member nolonger on rolls
                n += 1
                l.append( i['primaryEmail'] )
                logging.info( "%s: %d %s", "Remove",
                              capid,
                              i['name']['fullName'])
                # delete user document from DB
                if ( DELETE_PURGED ):
                    print("Delete document:", "self.DB().Google.delete({'_id':",
                          id,"})" )
        l.sort()
        # generate the purge job
        self.writePurge( l )
        logging.info( "Accounts purged: %d", n)
        # generate job to list purged members files for examination
        self.writeGetFiles( l )
        return

class Expired( Manager ):
    """
    Expired scans the Member collection for members whose membership
    has expired LOOKBACK or more days ago and issues a GAM command
    to suspend the users Wing account.
    """
    def __init__( self ):
        super().__init__()
        today = datetime.datetime.today()
        expired = today - timedelta( days = LOOKBACK )
        self.query = { 'MbrStatus' : 'EXPIRED',
                       'Expiration' : { '$lte': expired }}
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

    def run( self ):
        """
        Runs a query against the Member collection looking for expired
        members, if found issues a GAM command to suspend the Wing user
        Google account.  Only accounts that have expired more than LOOKBACK
        days are considered for suspension.  The account is NOT deleted
        and may be reactivated by any sys admin.
        Also prints a list of files owned by member.
        """
        gamcmdfmt = "gam {} user {} &>err"
        cur = self.DB().Member.find( self.query ).sort('CAPID',
                                                       pymongo.ASCENDING)
        n = 0   # number of suspended member accounts

        with open( self.outfileName, 'w' ) as outfile:
            for m in cur:
                g = self.DB().Google.find_one(
                    {'externalIds':{'$elemMatch':{'value':m[ 'CAPID' ]}},
                                    'suspended':False} )
                if ( g ):
                    n += 1
                    logging.info( "Suspend: %d %s %s %s %s", 
                                  m[ 'CAPID' ],
                                  m[ 'NameFirst' ],
                                  m[ 'NameLast' ],
                                  m[ 'NameSuffix' ],
                                  m[ 'Type' ] )
                    print( gamcmdfmt.format( EXPIRED_ACTION,
                                             g[ 'primaryEmail' ]),
                           file = outfile )
                else:
                    logging.error( "%s %d %s %s %s %s",
                                   "Suspend: No Google Account or suspended:",
                                   m[ 'CAPID' ],
                                   m[ 'NameFirst' ],
                                   m[ 'NameLast' ],
                                   m[ 'NameSuffix' ],
                                   m[ 'Type' ] )
        logging.info( "Accounts suspended: %d", n )
        return

class ListManager( Manager ):
    """
    Root class of all mailing list management subclasses/jobs.
    This is just a base class doesn't do anything, subclasses
    are the real actors.
    """
    def __init__(self):
        super().__init__()

    def run( self ):
        """
        Doesn't do anything just a placeholder for subclasses.
        """
        return

    def isGroupMember( self, groups, group ):
        """
        Search the users groups list to see if group email address is in
        the members list of groups. If not found return None.
        """
        for g in groups:
            if ( g['email'] == group ):
                return True
        return None # not member of group
    
class SeniorListChecker( ListManager ):
    """
    Scan Google users for senior members, check to see if they are on the
    senior mailing list, if not add them.
    """
    def __init__( self ):
        self.super().__init__()
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )
        self.query = {'organizations':{'$elemMatch':{'description':"SENIOR"}}}

    def run( self ):
        """
        Scan for senior members and add them to the senior mailing list
        """
        cur = self.DB().Google.find( self.query )
        gamcmdfmt = 'gam user {} add groups member {}'
        with open( self.outfileName, 'w' ) as outfile:
            for m in cur:
                primaryEmail = m['primaryEmail']
                if not self.isGroupMember( m['groups'], "seniors@nhwg.cap.gov"):
                    logging.info( "%s %s", "Senior mailing list Add:", primaryEmail ) 
                    print( gamcmdfnt.format( primaryEmail,
                           "seniors@nhwg.cap.gov"),
                           file = outfile )

class UnSuspend( Manager ):
    """
    UnSuspend scans Google documents for suspended accounts and checks
    them against the Member document to see if the member has re-upped and is
    ACTIVE again, if so the account is unsuspended.
    """
    def __init__( self ):
        super().__init__()
        self.query = { 'suspended' : True }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

    def updateNoPurgeList( self, capid ):
        """
        Check to see if member was on the NoPurge list for suspension
        at the National level and has now reappeared as ACTIVE and remove
        them from the NoPurge list. Allow account to be unsuspended.
        """
        try:
            r = self.DB().NoPurge.delete_one( {'CAPID' : capid } )
        except Exception as e:
            print( str( e ))
        return r.deleted_count

    def run( self ):
        """
        Scans Google account documents for suspended accounts. Checks account
        against the Member document to see if the member is ACTIVE again
        and emits a GAM command to unsuspend the account on Google.
        """
        gamcmdfmt = 'gam unsuspend user {}'
        count = 0
        cur = self.DB().Google.find( self.query ).sort( 'externalIds',
                                                        pymongo.ASCENDING )
        with open( self.outfileName, 'w' ) as outfile:
            for g in cur:
                # lookup user in Member documents
                m = self.DB().Member.find_one( { 'CAPID' : g[ 'externalIds'][0]['value'], 'MbrStatus' : 'ACTIVE' } )
                if m :
                    # check to see if member is on the NoPurge list and remove
                    self.updateNoPurgeList( m['CAPID'] )

                    # check to see if we should update the local Google collection
                    if UPDATE_SUSPEND :
                        result = self.DB().Google.update( { 'primaryEmail' : g['primaryEmail']},
                                       { '$set' : { 'suspended' : False,
                                                    'suspensionReason': '' }} )
                        if ( result[ 'nModified' ] == 0 ) :
                            logging.warn( "WARNING: Failed to update suspended for: %s in Google collection.",
                                          g[ 'primaryEmail' ] )
                    
                    print( gamcmdfmt.format( g[ 'primaryEmail' ] ),
                                             file = outfile )
                    logging.info( "UNSUSPEND: %d, %s, %s, %s",
                                  m['CAPID'], g['name']['fullName'],
                                  g['primaryEmail'], orgUnitPath[ m['Unit'] ] )
                    count += 1
            logging.info( "Total members reactivated: %d", count)

# Create the base object for all jobs
# MIMS is the factory base class object
MIMS = Manager()

def main():
    """
    Main - MIMS produces a stream of GAM commands to create, remove or 
    suspend users as a batch file.  The batch file can then be scheduled
    to run at a later time.
    """
    # Logging on/off to stderr
    LOGGING = os.environ.get( 'LOGGING' )

    job = MIMS.job( sys.argv[1] )
    job.run()
    job.DB().logout()
    MIMS.close()
    
###########################################
#
#       Invoke main function
#
###########################################
if __name__ == "__main__" :
    sys.exit( main() )
