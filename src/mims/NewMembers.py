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

class NewMembers( Manager ):
    """
    NewMembers - Is the base class for all member creation subclasses.
    It is intended as an abstract class containing services needed by
    subclasses to create new Google accounts.  In most cases the new member
    creation subclass will only need to declare the query needed to find
    potential members in the Member collection, and the name of the
    mailing list/group if any used by those members.  Each new member
    has the wing calendar added to their personal calendar.

    The run method does the work of generating the commands necessary to
    create the members Gmail account and add to the mailing list supplied.
    In rare cases with special requirements a subclass may need to
    override the run method.
    """
    helpMsg = 'Abastract class does nothing, holds machinery for sub-jobs'

    # Flag as not a job, as not to include this in the jobs listing.
#    is_a_job = False

    def __init__(self):
        super().__init__()
        self.domain = DOMAIN
        # MongoDB query to find members
        self.query = None
        # GAM account creation command
        self.gamaccountfmt = 'gam create user {} givenname "{}" familyname "{}" orgunitpath "{}" password \'{}\' changepassword true Member.CAPID {:d} Member.Unit {} Member.Type {}'
        # GAM command to email notification to new member
        self.gamnotifyfmt = ' notify {} subject "{}" file {}'
        # Calendar template command
        self.calcmdfmt = 'gam user {} add calendar {}'
        # Group or groups string, comma separted groups, to add member to
        self.groups = None
        # Add members to the newbies group, use eServices PRIMARY EMAIL
        self.newbies = False
        self.newbieGroup = None
        self.gamnewbiecmd = 'gam update group {} add member {}'
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
        email = eval(CONFIGURATION.makeMemberEmailAddress)
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
                                                       'CAPID': m['CAPID'],
                                                       'Unit' : m['Unit'],
                                                       'Type' : m['Type']
                                                   }}} )
            except DuplicateKeyError as e:
                print( "ERROR::NewMember.mkNewAccount",e, "primaryEmail:", email,
                       "CAPID:", m['CAPID'] )
                logging.error( "ERROR:Duplicate account: %s primaryEmail: %s, CAPID: %d",
                               e, email,
                               m['CAPID'] )
                return None
            # Append the default groups
            if self.groups:
                cmd = cmd + " groups " + '"' + self.groups + '"'
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
                   ", NO Primary Email, account not created.",
                   file = self.outfile )
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
        if DEBUG:
            print( f"{self.__class__.__name__}:{sys._getframe().f_code.co_name}()" )

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
                            if self.newbies:
                                cmd = self.gamnewbiecmd.format(
                                self.newbieGroup,
                                self.getContact( m['CAPID'], 'EMAIL', 'PRIMARY' ))
                                print( cmd, file = self.outfile )
                                logging.info( 'Added member: %s to newbie group: %s',
                                              m['CAPID'], self.newbieGroup )
                            self.addCalendar( email, DOMAIN_CALENDAR )
                            n += 1
                            
        logging.info( "New accounts created: %d", n)
        return

