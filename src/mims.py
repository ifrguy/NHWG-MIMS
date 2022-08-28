#!/usr/bin/env /usr/bin/python3
## Copyright 2021 Marshall E. Giguere
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


version_tuple = (1,6,9)
VERSION = 'v{}.{}.{}'.format(version_tuple[0], version_tuple[1], version_tuple[2])

"""
MIMS - Member Information Management System.

       Google account synchronization between National and NH Wing.
       MIMS uses a combintation of MongoDB, Python, and the GAMADV-X
       Google Account Management tool. Requires G-Suite admin privileges.

History:
19Aug22 MEG Catch DuplicateKeyError exception on mkNewAccount().
19Aug22 MEG mkNewAccount(), add CAPID to Google placeholder.
01Aug22 MEG UnSuspend.run() report, skip Google records without custom schema.
24Mar22 MEG Disable bulk calendar event notifications on wing calendar.
28Jan22 MEG Change insert to insert_one method for pymonogo >3.6
17Dec21 MEG Updates for Python 3.8+ and MongoDB 5.0
17Dec21 MEG ListManager classes and functions removed replace by javascript.
05Nov21 MEG NewMember now addes primary email to a newbie group if configured.
03Apr21 MEG Wing Calendar add moved to separate batch job file due to Google sync issue.
03Apr21 MEG NewMember moved calendar cmd format declaration to init.
29Mar21 MEG Manager, add wing calendar to new account calendars.
04Feb21 JCV Added class for checking/reconciling Member type
01Jan21 MEG Fixed syntax error in CheckOrgUnit custom schema update.
16Dec20 JCV Added class for checking/reconciling organization/unit 
12Dec20 MEG UnSuspend.run now uses expiration date only.
09Nov20 MEG Default groups for account creation load from the config file
18Sep20 MEG NewMembers:mkNewAccount fixed gam command arg misalignment
11Sep20 MEG SweepExpired added checkHolds check
11Sep20 MEG Fixed bad reference bug in UnSuspend
05Sep20 MEG Switch to custom schema fields for Member.{CAPID,Unit,Type}
02May20 MEG Expired do not suspend member if on hold status
24Jan20 MEG NewMembers do not create user account if no eServices primary email.
15Nov19 MEG SweepExpired - log member status change to db.
11Nov19 MEG NewMember.mkNewAccount add placeholder record to Google for new accounts.
31Oct19 MEG SweepExpired updated, only uses expiration date and offset.
03Oct19 MEG PurgeMembers only tracks expiration date and GRACE.
03Oct19 MEG Expired now tracks expiration date only, not MbrStatus.
21Jul19 MEG Added custom schema: Member.CAPID,Member.Unit,Member.Type to NewMembers 
08Jul19 MEG Removed mimetype from filelist for purged member.
06Jul19 MEG Removed "message" from sendemail syntax update.
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
            return globals()[ job ]()   # create subclass job instance
        except KeyError as e:
            print('ERROR: no such job: ', e )
            ( help().run() )
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
        print( sys.argv[0], " <job> [arg ...]" )
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
    mailing list/group if any used by those members.  Eac new member
    has the wing calendar added to their personal calendar.

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
        self.gamaccountfmt = 'gam create user {} givenname "{}" familyname "{}" orgunitpath "{}" password \'{}\' changepassword true Member.CAPID {:d} Member.Unit {} Member.Type {}'
        # GAM group add member command
        self.gamgroupfmt = 'gam update groups {} add member {}'
        # GAM command to email notification to new member
        self.gamnotifyfmt = ' notify {} subject "{}" file {}'
        # Calendar template command
        self.calcmdfmt = 'gam user {} add calendar {}'
        # Group or groups string, comma separted groups, to add member to
        self.group = None
        # Add members to the newbies group
        self.newbies = False
        self.newbieGroup = None
        self.outfile = None
        self.caloutfile = None
        # calendar add job file
        self.caloutfileName = JobFilePath + self.name() + 'Calendar' + self.TS() + ".job"
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
        Input m: eServices Member record.
        Output GAM member creation command to job file.
        Returns Gmail address, adds placeholder record to Google
        to prevent duplication of new email addresses.
        NOTE: if the member does not have a PRIMARY EMAIL no account is created
        and None is returned.
        """
        contact = self.getContact( m['CAPID'],
                                   'EMAIL',
                                   'PRIMARY')
        email = None
        if contact:
            email = self.mkEmailAddress( m )
            cmd = self.gamaccountfmt.format( email,
                                             self.givenName( m ),
                                             self.familyName( m ),
                                             orgUnitPath[ m[ 'Unit' ] ],
                                             self.mkpasswd(),
                                             m[ 'CAPID' ],
                                             m[ 'Unit' ],
                                             m[ 'Type' ])
            # Write a placeholder to Google to record the new account
            # so we don't try to create a duplicate address.
            try:
                self.DB().Google.insert_one( { 'primaryEmail': email,
                                               'customSchemas': {
                                                   'Member': {
                                                       'CAPID': m['CAPID'] }}} )
            except DuplicateKeyError as e:
                print( "ERROR::NewMember.mkNewAccount",e, "primaryEmail:", email,
                       "CAPID:", m['CAPID'] )
                logging.error( "ERROR: %s primaryEmail: %s, CAPID: %d",
                               e, email,
                               m['CAPID'] )
                return None
            # check for primary email to notify member
            cmd = cmd + self.gamnotifyfmt.format( contact,
                                             "Welcome to your NH Wing account",
                                             WELCOMEMSG )
            print( cmd, file = self.outfile )
            logging.info( "New User: %d %s %s %s Unit: %s",
                          m['CAPID'],m['NameFirst'],
                          m['NameLast'],
                          m['NameSuffix'],
                          orgUnitPath[ m[ 'Unit' ]] )
        else: # do not issue account
            logging.warning( "%d %s %s %s no primary email, no account created .",
                          m['CAPID'],m['NameFirst'],
                          m['NameLast'],
                          m['NameSuffix'] )
            print( "# WARNING:" + str(m['CAPID']) + ": " + m['NameFirst'] +
                   " " + m['NameLast'] + " " + m['NameSuffix'] +
                   ", NO Primary Email, no account created.",
                   file = self.outfile )
        return email

    def addToGroup( self, group, email ):
        """
        Add a member to a group
        Input member Google email address
        Output GAM command to add member to a mailing list/groups.
        Note: this function always succeeds.
        """
        if ( group and email ):
            groupcmd = self.gamgroupfmt.format( group, email  )
            logging.info( 'Member: %s added to %s mailing list.',
                          email,
                          group )
            print( groupcmd, file = self.outfile )
        return email
        
    def addCalendar( self, email, calEntity ):
        """
        Add a calender to the users calendars.
        Skip if DOMAIN_CALENDAR is not defined.
        Input:
        email - user email
        calEntity - Google calendar ID (calendars email address)
        Output - writes gam command to output file

        NOTE: no error checking is done
        """
        if ( calEntity ):
            print( self.calcmdfmt.format( email, calEntity ),
                   file = self.caloutfile )
            logging.info( 'Calendar: %s add to User: %s ',
                          email, calEntity )
        
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
            with open( self.caloutfileName, 'w' ) as self.caloutfile:
                for m in cur:
                    if ( m['Unit'] not in orgUnitPath ):
                        logging.error('Unknown unit: %s, CAPID: %d no account created.',
                                      m['Unit'],
                                      m['CAPID'] )
                        continue
                    # see if member has Google account
                    g = self.DB().Google.find_one( {
                        'customSchemas.Member.CAPID': m['CAPID'] } )
                    if ( g == None ): # if user does not exist make new account
                        email = self.mkNewAccount( m )
                        if email:
                            # add member to group mailing list if one exists
                            self.addToGroup( self.group, email )
                            # check to see if we are doing a newbie group
                            if( self.newbies ):
                                self.addToGroup( self.newbieGroup,
                                                 self.getContact( m['CAPID'],
                                                                  'EMAIL',
                                                                  'PRIMARY' )
                                                 )
                            self.addCalendar( email, DOMAIN_CALENDAR )
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
        self.group = SENIORGROUPS
        self.newbies = SENIOR_NEWBIES
        self.newbieGroup = NEWBIE_GROUP
        self.query = { 'Type':'SENIOR',
                       'MbrStatus':'ACTIVE',
                       'Unit' : { '$ne' : '000' }  }
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )

class NewCadets( NewMembers ):
    """
    Scans the Member table for Cadet members not having Google accounts.
    Makes a new account if the cadet member is active and is min age or over.   
    """
    helpMsg = 'Create wing accounts for Cadet members {} yrs or older.'.format(MIN_CADET_AGE)

    def __init__( self ):
        super().__init__()
        self.group = CADETGROUPS
        self.newbies = CADET_NEWBIES
        self.newbieGroup = CADET_NEWBIE_GROUP
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
            logging.warning('Cadet account creation is not enabled.')
        return

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

    def __init__(self):
        super().__init__()
        # look back date
        self.lookback = datetime.utcnow() - timedelta( days=LOOKBACK + GRACE )
        self.outfileName = JobFilePath + 'hold-' + self.name() + self.TS() + ".job"
        self.query = { 'Expiration': {'$lte': self.lookback },
                       'CAPID' : { '$gt' : 99999 } }
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
            logging.info( "Remove: %d %s", capid,
                          g['name']['fullName'])
            # Mark member as Ex-member
            self.markEXMEMBER( m['CAPID'] )
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
        self.query = { 'Expiration' : { '$lte': expired },
                       'CAPID' : { '$gt' : 99999 } }
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
                # Check if member is on hold status
                if ( self.checkHolds( m['CAPID'] )): continue
                # Check if member is already an EXMEMBER
                try:
                    if ( m['NHWGStatus'] == "EXMEMBER" ): continue
                except KeyError as e:
                    if ( m['MbrStatus'] == 'EXMEMBER' ): continue

                g = self.DB().Google.find_one(
                    {'customSchemas.Member.CAPID': m['CAPID']} )
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
        super().__init__()
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )
        self.query = { 'customSchemas.Member.Type' : "SENIOR" }

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
                    print( gamcmdfmt.format( primaryEmail,
                           "seniors@nhwg.cap.gov"),
                           file = outfile )

class UnSuspend( Manager ):
    """
    UnSuspend scans Google documents for suspended accounts and checks
    them against the Member document to see if the member has re-upped and is
    ACTIVE again, if so the account is unsuspended. Members in the Hold
    collection are ignored.
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
        against the Member document to see if the member is active again by
        looking at the expiration date. Emit a GAM command to unsuspend the
        account on Google G Suite if active.
        """
        gamcmdfmt = 'gam unsuspend user {}'
        count = 0
        today = datetime.today()
        
        cur = self.DB().Google.find( self.query ).sort( 'customSchemas.Member.CAPID',
                                                        pymongo.ASCENDING )
        with open( self.outfileName, 'w' ) as outfile:
            for g in cur:
                # lookup user in Member documents
                try:
                    m = self.DB().Member.find_one(
                        { 'CAPID' : g[ 'customSchemas']['Member']['CAPID'] }
                    )
                except KeyError as e:
                    print("WARNING::UnSuspend:run: ",
                          "Missing or corrupt customSchema in Google _id:",
                          g['_id'], "primaryEmail:",
                          g['primaryEmail'],
                          " SKIPPING." )
                    continue
                if ( m ) :
                    # check to see if member is on the Holds list and skip
                    if ( self.checkHolds( m['CAPID'] )):
                        logging.warning("Member on permanent hold CAPID: %d, Account: %s not reactivated.",
                                     m['CAPID'],
                                     g['primaryEmail'] )
                        continue
                    # if membership is still expired skip reactivation
                    if ( m[ 'Expiration' ] < today ):
                        continue
                    # check to see if we should update the local Google collection
                    if UPDATE_SUSPEND :
                        result = self.DB().Google.update_one( { 'primaryEmail' : g['primaryEmail']},
                                       { '$set' : { 'suspended' : False,
                                                    'suspensionReason': '' }} )
                        if ( result[ 'nModified' ] == 0 ) :
                            logging.warning( "WARNING: Failed to update suspended for: %s in Google collection.",
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
    been removed or marked as EXMEMBER and mark them, records are purged
    from the Google collection depending on the state of the DELETE_PURGED
    configuration option. The default lookback period is 30 days beyond
    LOOKBACK + GRACE unless argv[2] contains an integer value.

    SweepExpired creates a job file to delete any accounts found in the Google
    collection as a precaution.  This may fail if the account has already
    been deleted, but it's a small price to pay for security.
    """

    helpMsg = 'Maintenance: purge expired members not already removed, args: [lookback days].'

    def __init__( self ):
        super().__init__()
        logging.basicConfig( filename = self.logfileName, filemode = 'w',
                             level = logging.DEBUG )
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
        cursor = self.DB().Member.find( self.query )
        with open( self.outfileName, 'w' ) as outfile:
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
                    print( 'gam delete user {}'.format(
                           g['primaryEmail']), file = outfile )
                    if ( DELETE_PURGED ):
                        self.DB().Google.delete_one( { '_id': g[ '_id' ] } )
                    logging.info( "Member: %d Purged from Google: %s",
                          member[ 'CAPID' ],
                          DELETE_PURGED )


class CheckOrgUnit ( Manager ):
    """
    CheckOrgUnit - Class for reconciling Unit from eServices and Unit/orgUnitPath from Google
    """
    helpMsg = 'Compares CAPWATCH organizational unit to Google and updates Google if different'

    def __init__(self):
        super().__init__()
        self.domain = DOMAIN

        # MongoDB aggregation:
        self.query = [
        # Stage 0: we just care about 'ACTIVE' members and those not in the special unit 000:
            { '$match' : { 'MbrStatus' : 'ACTIVE',
                           'Unit' : { '$ne' : '000' }
                         }
            },

        # Stage 1: join CAPWATCH and Google collections based on CAPID:
            { '$lookup' : {
                'from': "Google",
                'localField': "CAPID",
                'foreignField': "customSchemas.Member.CAPID",
                'as': "tempAgg"
                }
            },

        # Stage 2:  unwind (or flatten) the "tempAgg" element
            { '$unwind' : {
                'path': "$tempAgg"
                }
            },

        # Stage 3:  limit the result to just the fields we care about
            { '$project' : {
                "Gid" : "$tempAgg.customSchemas.Member.CAPID",
                "primaryEmail" : "$tempAgg.primaryEmail",
                "orgUnit" : "$tempAgg.orgUnitPath",
                "GUnit" : "$tempAgg.customSchemas.Member.Unit",
                "CUnit" : "$Unit"
                }
            }
        ]

        # GAM update command: we'll be updating 'orgUnitPath' and 'Member.Unit' in the Google records:
        self.gamupdate = 'gam update user {} orgUnitPath "{}" Member.Unit "{}"'
        logging.basicConfig( filename = self.logfileName, filemode = 'w', level = logging.DEBUG )

    def run(self):
        # Perform a "join" to get overlap of Google and CAPWATCH entries based on CAPID
        result = self.DB().Member.aggregate( self.query)

        n = 0 # number of modifications (i.e. number of members who transferred units)

        # Iterate over result and generate gam command where needed:
        with open ( self.outfileName, 'w' ) as outfile:
            for m in result:
                # Act on those records for which the Member.Unit from Google does not equal the Unit from CAPWATCH:
                if ( m[ 'GUnit' ] != m[ 'CUnit' ] ):
                    n += 1
                    logging.info("The Unit is different for CAPID [%d] %s versus %s", m['Gid'],m['GUnit'], m['CUnit'])

                    # Here's where we add a gam command to the batch file to update the Google record
                    print( self.gamupdate.format( m['primaryEmail'], orgUnitPath[ m[ 'CUnit' ] ], m[ 'CUnit' ]), file = outfile )
            logging.info( "Total members who changed units: %d", n)


class CheckMemberType ( Manager ):
    """
    CheckMemberType - Class for reconciling Member.Type from eServices and customSchemas.Member.Type from Google
    """
    helpMsg = 'Compares CAPWATCH member type to Google and updates Google if different'

    def __init__(self):
        super().__init__()
        self.domain = DOMAIN

        # MongoDB aggregation:
        self.query = [

        # Stage 1: join CAPWATCH and Google collections based on CAPID:
            { '$lookup' : {
                'from': "Member",
                'localField': "customSchemas.Member.CAPID",
                'foreignField': "CAPID",
                'as': "tempAgg"
                }
            },

        # Stage 2:  unwind (or flatten) the "tempAgg" element
            { '$unwind' : {
                'path': "$tempAgg"
                }
            },

        # Stage 3:  limit the result to just the fields we care about
            { '$project' : {
                "CAPID" : "$customSchemas.Member.CAPID",
                "primaryEmail" : "$primaryEmail",
                "mType" : "$tempAgg.Type",
                "gType" : "$customSchemas.Member.Type"
                }
            }
        ]

        # GAM update command: we'll be updating 'Member.Type' in the Google records:
        self.gamupdate = 'gam update user {} Member.Type "{}" '
        logging.basicConfig( filename = self.logfileName, filemode = 'w', level = logging.DEBUG )

    def run(self):
        # Perform a "join" to get overlap of Google and CAPWATCH entries based on CAPID
        result = self.DB().Google.aggregate( self.query)

        n = 0 # number of modifications (i.e. number of members whose member type changed)

        # Iterate over result and generate gam command where needed:
        with open ( self.outfileName, 'w' ) as outfile:
            for m in result:
                # Act on those records for which the Member Type from Google does not equal that from CAPWATCH:
                if ( m[ 'gType' ] != m[ 'mType' ] ):
                    n += 1
                    logging.info("The member type for CAPID [%s] has changed from %s to %s", m['CAPID'],m['gType'], m['mType'])

                    # Here's where we add a gam command to the batch file to update the Google record
                    print( self.gamupdate.format( m['primaryEmail'], m['mType']), file = outfile )
            logging.info( "Total members who changed type of membership: %d", n)
    
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
        MIMS.close()
        sys.exit( 0 )

# All good try to run job        
    job = MIMS.job( sys.argv[1] )
    job.run()
    MIMS.close()
    
###########################################
#
#       Invoke main function
#
###########################################
if __name__ == "__main__" :
    sys.exit( main() )
