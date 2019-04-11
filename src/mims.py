#!/usr/bin/env /usr/bin/python3
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


version_tuple = (1,3,0)
VERSION = 'v{}.{}.{}'.format(version_tuple[0], version_tuple[1], version_tuple[2])

"""
MIMS - Member Information Management System.
       Google account synchronization between National and NH Wing.
       MIMS uses a combintation of MongoDB, Python, and the GAMADV-X
       Google Account Management tool. Requires G-Suite admin privileges.

History:
11Apr19 MEG Each class now includes brief description of each job for help.
11Apr19 MEG Moved orgUnitPath map to mims_conf.
10Apr19 MEG Added SweepExipred class to clean expired but unremoved members.
05Apr19 MEG PurgeMembers now checks for expired and exmembers.
07Aug18 MEG Create accounts for Cadets >= 18 years.
03Jun18 MEG Mongo now requires regexs to be packaged in bson
26May18 MEG Expired.run(), skip already suspended members.
19May18 MEG Improved random password generation.
14May18 MEG Updated client authentication to Mongo 3.6
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
import os, sys, string, random
import logging
import pymongo
from datetime import date, timedelta, datetime, timezone
from pymongo import *
import re
from mims_conf import *
from credentials import *
from bson.regex import Regex

class Manager(object):
    """
    Manager is the super class/factory for all jobs to be done. Manager
    doesn't really do anything but maintain a list of jobs and the context
    for all jobs, i.e. MongoDB database connection, etc.

    Manager is a factory class.  It manages and returns subclasses that
    actually do the work, like adding new members to the rolls, or removing
    members that have fallen off the rolls.
    """
    helpMsg = 'Top level'

    __client = MongoClient( host=MIMS_HOST, port=MIMS_PORT,
                            username=MIMSUSER, password=MIMSPASS,
                            authSource=MIMS_DB)
    __DB = __client[ MIMS_DB ]
    __TS = datetime.now().strftime("%Y%m%dT%H%M")
    def __init__( self ):
        self.myJobs = self.allSubClasses( type( self ))
        __TS = datetime.now().strftime("%Y%m%dT%H%M")
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
            allsubs.append( sub )
            allsubs.extend( self.allSubClasses( sub ))
        return allsubs

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

class help( Manager ):
    """
    Prints a help screen.
    """
    helpMsg = 'Prints this message.'

    def __init__( self ):
        super().__init__()

    def run( self ):
        """
        Print help and forces exit.
        """
        print("Summary:")
        print( sys.argv[0], " <job>" )
        print( 'Version:', VERSION )
        print( 'Available jobs:' )
        for job in MIMS.jobs():
            print( job.__name__, '-', job.helpMsg )

        
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
    helpMsg = 'Abastract class does nothing, holds machinery for sub-jobs'

    def __init__(self):
        super().__init__()
        self.domain = DOMAIN
        # MongoDB query to find members
        self.query = None
        # GAM account creation command
        self.gamaccountfmt = 'gam create user {} externalid organization {:d} givenname "{}" familyname "{}" organizations department {} description {} primary orgunitpath "{}" password \'{}\' changepassword true'
        # GAM group add member command
        self.gamgroupfmt = 'gam update group {}@' + self.domain + ' add member {}'
        # GAM command to email notification to new member
        self.gamnotifyfmt = ' notify {} subject "{}" message file {}'
        # Group to add member to
        self.group = None
        self.outfile = None
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

    def age( self, dob ):
        """
        Computes the age of a member based on DOB field.
        Birthdays are assumed to always be on the first day of the month.
        Input: python datatime object containing the birth date
        Returns: age in whole years, truncated to nearest year.
        """
        yr = datetime.utcnow().year
        m = datetime.utcnow().month
        return int(((( yr - dob.year) * 12 ) + ( m - dob.month ))/12)

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
                                         { '$regex': Regex('^'+nm, 'i')}} )):
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
        email = re.sub( '[\' ]', '', email )  # remove apostrophes & spaces
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
                                self.mkpasswd() )
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
        
        
    def mkpasswd( self, max=12 ):
        """
        Make a random password and return it.
        The password will be a random string between min
        and max chars in length.

        Input: max - max chars in password. Default is 12.
        Output: string
        """
        min = 8
        pwd = ''
        chars = string.ascii_uppercase + string.ascii_lowercase + \
        string.digits + '!@#$%^&+='
        size = random.randint( min, max )
        return pwd.join( random.choice( chars ) for x in range( size ) )

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
    helpMsg = 'Create wing accounts for new Senior members.'

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
    Makes a new account if the member is active and is 18 years of age or over.    """
    helpMsg = 'Create wing accounts for Cadet members 18 yrs or older.'

    def __init__( self ):
        super().__init__()
        self.group = None
        y = datetime.utcnow().year - MIN_CADET_AGE
        m = datetime.utcnow().month
        qd = datetime( y, m, 1, tzinfo=timezone.utc)
        self.query = { 'Type':'CADET',
                       'MbrStatus':'ACTIVE',
                       'DOB': { u'$lte' : qd }
        }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

    def run(self):
        """
        Create Cadet accounts if enabled.
        Account creation restricted by MIN_CADET_AGE.
        """
        if ( CREATE_CADET_ACCOUNTS ):
            super().run()
        else:
            print('Cadet account creation is not enabled.')
            logging.warn('Cadet account creation is not enabled.')
        return

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

    helpMsg = "Remove accounts of members no longer on CAP rolls,\n job placed on hold for review, creates file listing job."

    def __init__(self):
        super().__init__()
        self.outfileName = JobFilePath + 'hold-' + self.name() + self.TS() + ".job"
        self.query =  { '$or': [ { "MbrStatus": "EXMEMBER" }, { "MbrStatus": "EXPIRED" } ] }
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
        gamcmdfmt = 'gam user {} print filelist fields "title,mimetype"'
        filename = JobFilePath + 'FileList' + self.TS() + '.job'
        with open( filename, 'w' ) as ofile:
            for j in list:
                print( gamcmdfmt.format( j ),
                       file = ofile )
        return

    def run(self):
        """
        Pulls all members marked as EXPIRED.  If membership has been
        expired for 90 days or more the account is removed and the member
        is marked as a ex-member.  The resulting gam purge job is placed in the
        hold state until released by the operator.  In addition a gam job
        to list all files own by users is produced. Users placed on HOLD
        are skipped.
        """
        # look back period
        lookback = datetime.utcnow() - timedelta( days=90 )
        l = []  # list of members to remove
        #Scan all expired members
        cur = self.DB().Member.find( self.query )
        for m in cur:
            capid = m['CAPID']
            if ( m['Expiration'] <= lookback ):
#                g = self.DB().Google.find_one( { 'externalIds':{'$elemMatch':{'value':{'$eq': m['CAPID']}}}})
# Note this query may fail if there is more than one record in externalIds
                g = self.DB().Google.find_one({'externalIds.value': m['CAPID']})
                if ( g == None ): continue
                if ( self.checkHolds( capid )):
                     logging.info('HOLD: %d %s, account: %s',
                                  capid, g['fullName'],
                                  g['primaryEmail'] )
                     continue
                l.append( g['primaryEmail'] )
                logging.info( "Remove: %d %s", capid,
                              g['name']['fullName'])
# Mark member as Ex-member
                self.DB().Member.update_one( { '_id' : m['_id']},
                                             {'$set': {'MbrStatus': 'EXMEMBER' }})
                # delete Google user record from Google collection
                if ( DELETE_PURGED ):
                    self.DB().Google.delete_one({'_id': g['_id']})
        l.sort()
        # generate the purge job
        self.writePurge( l )
        logging.info( "Accounts purged: %d", len( l ))
        # generate job to list purged members files for examination
        self.writeGetFiles( l )
        return

class Expired( Manager ):
    """
    Expired scans the Member collection for members whose membership
    has expired LOOKBACK or more days ago and issues a GAM command
    to suspend the users Wing account.
    """

    helpMsg = 'Suspend member wing accounts of expired members.'

    def __init__( self ):
        super().__init__()
        today = datetime.today()
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
        """
        gamcmdfmt = "gam {} user {}"
        cur = self.DB().Member.find( self.query ).sort('CAPID',
                                                       pymongo.ASCENDING)
        n = 0   # number of suspended member accounts

        with open( self.outfileName, 'w' ) as outfile:
            for m in cur:
                g = self.DB().Google.find_one(
                    {'externalIds':{'$elemMatch':{'value':m[ 'CAPID' ]}}} )
                if ( g ):
                    if ( g[ 'suspended' ] ): continue # already suspended
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

    helpMsg = 'Abastract class does nothing. Top level for list management.'

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

    helpMsg = 'Maintenance check that all seniors are on senior mailing list.'

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

    helpMsg = 'Reactivate wing accounts for re-upped members.'

    def __init__( self ):
        super().__init__()
        self.query = { 'suspended' : True }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

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
                if ( m ) :
                    # check to see if member is on the Holds list and skip
                    if ( self.checkHolds( m['CAPID'] )):
                        logging.warn("Member on permanent hold CAPID: %d, Account: %s not reactivated.",
                                     m['CAPID'],
                                     g['primaryEmail'] )
                        continue

                    # check to see if we should update the local Google collection
                    if UPDATE_SUSPEND :
                        result = self.DB().Google.update_one( { 'primaryEmail' : g['primaryEmail']},
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

class SweepExpired( Manager ):
    """
    SweepExpired is intended as a maintenance function.  It's purpose is to
    scan the Member collection for old memberships that have expired, but not
    been removed or marked as EXMEMBER and to so mark them, records are purged
    from the Google collection depending on the state of the DELETE_PURGED
    configuration option. The default lookback period is 100 days
    unless argv[2] contains an integer value.

    SweepExpired does not create a job file as it works directly on the local
    database.
    """

    helpMsg = 'Maintenance job clean out expired members not already removed.'

    def __init__( self ):
        super().__init__()
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )
        # build up query for use in run()
        try:
            look_back_days = int( sys.argv[ 2 ] )
        except ( IndexError, ValueError ) as e:
            look_back_days = 100
        # compute look back date
        today = datetime.today()
        start_date = today - timedelta( days = look_back_days )
        self.query = { 'MbrStatus' : 'EXPIRED',
                       'Expiration' : { '$lte' : start_date }}

    def run( self ):
        """
        Run the query against the Member collection and mark
        select documents as EXMEMBERs.
        """
        cursor = self.DB().Member.find( self.query )
        for member in cursor:
            self.DB().Member.update_one( { 'CAPID' : member[ 'CAPID' ] },
                                         { '$set' : { 'MbrStatus' : 'EXMEMBER' }})
            # delete Google account record if one exists
            g = self.DB().Google.find_one({'externalIds.value': member['CAPID']})
            if ( g and DELETE_PURGED ):
                    self.DB().Google.delete_one( { '_id': g[ '_id' ] } )
            logging.info( "Member: %d marked EXMEMBER, Purged from Google: %s",
                          member[ 'CAPID' ],
                          DELETE_PURGED )
        

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
# check for no job on command line
    if ( len(sys.argv) < 2 ):
        MIMS.job( 'help' ).run()
        MIMS.DB().logout()
        MIMS.close()
        sys.exit( 0 )

# All good try to run job        
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
