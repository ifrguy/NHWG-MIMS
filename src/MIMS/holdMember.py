#!/usr/bin/python3

# holdMember/unholdMember/onHold: manages member account hold status
# Google account from being removed, or removes the hold so the
# member account can be removed or reinstated.
# If called as holdMember inserts CAPID in Holds, adds HOLD to Member wing status field.
# If called as unholdMember removes CAPID from Holds
# If called as onHold [ CAPID ] lists all holds, or if passed a CAPID lists
# a single hold.

## Set up:
## To used unholdMember and onHold you must create symbolic links to the
## main Python script holdMember.py:
## $> ln -s ./holdMember.py unholdMember.py
## $> ln -s ./holdMember.py onHold.py

# History:
# 23Jan25 MEG NHWGStatus DB field name changed to WingStatus.
# 04Jan25 MEG Port, host, DB options, reorganized and refactored code.
# 01Jan25 MEG Added command line argument parsing
# 01Jun22 MEG Fixed dangling if in "unhold()"                                   
# 01Jun22 MEG Removed deprecated db logout function call.                       
# 08Mar21 MEG Added date stamp to hold
# 02May20 MEG Set/unset Wing status on Member, check for duplicate holds on set
# 09Aug18 MEG Added on hold checking
# 15Jun18 MEG Created

import os, sys, argparse
from datetime import date, timedelta, datetime, timezone
from pymongo import MongoClient
from hold_credentials import *

# Mongo DB connection info
Client = None
DB = None
HOST = 'localhost'
PORT = 27017
DBNAME = 'NHWG'
PROG = os.path.basename( sys.argv[0] )
parser = argparse.ArgumentParser( description='Process commands for the Hold suite' )

# Attach arguments
parser.add_argument( '-d', '--db', default=DBNAME,
                     help='Database name (' + DBNAME + ')' )
parser.add_argument( '-H', '--host', default=HOST,
                     help='server hostname (' + HOST + ')' )
parser.add_argument( '-p', '--port', type=int, default=PORT,
                     help='server connection port, use this to connect via an ssh tunnel (' + str(PORT) +')' )
parser.add_argument( '-F', '--func', default=None, choices=[ 'holdMember',
                                                             'unholdMember',
                                                             'onHold'
                                                            ],
                     help="Run one of the builtin functions,\ntakes precedence over program name." )
parser.add_argument( 'capid', type=int, nargs='?', help="CAPID" )
parser.add_argument( 'comment', nargs='?', help="Hold comment: must include requestor and reason." )

# suck in the command line args and set values
# argparse retuns an anonmyous object, each attribute holds a single
# arg's value
cmdArgs = parser.parse_args()

# see if user overrides defaults
HOST = cmdArgs.host
PORT = cmdArgs.port
DBNAME = cmdArgs.db
# Here's where we decide if the program name or -F option selects behavior
# This is the name that is used to dispatch the appropriate function,
# -F/--func takes precedence over filename/symlink name.
FUNCNAME = cmdArgs.func if cmdArgs.func else os.path.basename( sys.argv[0] ).split(".")[0]

# Local function help
HELP = { "holdMember" : "Usage: " + FUNCNAME + ".py [dHp] CAPID \"comment\"",
         "unholdMember" : "Usage: " + FUNCNAME + ".py [dHp] CAPID",
         "onHold" : "Usage: " + FUNCNAME + ".py [dHp] [CAPID]",
}


def hold( db, args ):
    """
    Places a member account on hold to prevent removal
    """
    capid = args.capid
    if ( capid == None ):
        print("Error::hold: CAPID required.")
        print( HELP[ FUNCNAME ] )
        return( 1 )

    try:
        # check for valid, active member
        mrec = db.Member.find_one( { 'CAPID' : capid } )
        if not mrec:
            print('Error::Member: ' + str(capid) + ' not found.' )
            print( HELP[ FUNCNAME ] )
            return( 1 )
    except:
        None
        
    try:
        comment = args.comment
    except AttributeError:
        print( "Error::hold: A comment is required to place a member on hold." )
        print( HELP[ FUNCNAME ] )
        return( 1 )
        
    # Check for previous hold status
    if ( db.Holds.find_one( { 'CAPID' : capid } )):
        print("ERROR: CAPID:", capid, "already on hold." )
        return( 1 )
        
    db.Holds.insert_one( { "CAPID": capid,

                           "Comment" : comment,
                           "Date" : datetime.now() } )
    db.Member.update_one( { 'CAPID' : capid }, { '$set' : { 'WingStatus':
                                                            'HOLD' }} )
    return( 0 )

def unhold( db, args ):
    """
    Removes member account from hold status.
    """
    capid = args.capid
    if ( capid ):
        r = db.Holds.find_one( { "CAPID" : capid } )
        if ( r ):
            db.Holds.delete_one( { '_id' : r[ '_id' ] } )
            db.Member.update_one( { 'CAPID' : capid }, { '$set' : { 'WingStatus' : None }} )
        else:
            print( "Error::CAPID:", capid, "not found." )
            return( 1 )
    else:
        print( HELP[ FUNCNAME ] )
        return( 1 )

    return( 0 )

def onhold( db, args ):
    """
    Print a list of member accounts on hold, or check for a specific member.
    """
    msg = 'CAPID: {} {} {}, Comment: {} {}'
    capid = args.capid
    # do member lookup for hold
    if ( capid ):
        h = db.Holds.find_one( {'CAPID':capid} )
        m = None
        if (  h  ):
            m = db.Member.find_one( {'CAPID':capid} )
            if ( m ):
                print( msg.format( m['CAPID'],
                                   m['NameFirst'],
                                   m['NameLast']+m['NameSuffix'],
                                   h['Comment'],
                                   h['Date'].strftime("%Y-%m-%d:T%H%M")))
        else:
            print( 'CAPID: ', capid, 'Not on hold.')
    else:
        # Dump all hold records
            cur = db.Holds.find({})
            for h in cur:
                m = db.Member.find_one( { 'CAPID' : h['CAPID'] } )
                if ( m ):
                    print( msg.format( m['CAPID'],
                                       m['NameFirst'],
                                       m['NameLast']+m['NameSuffix'],
                                       h['Comment'],
                                       h['Date'].strftime("%Y-%m-%d:T%H%M")))
                else:
                    print( msg.format( h['CAPID'], 'Unknown', 'Unknown',
                                       h['Comment'],
                                       h['Date'].strftime("%Y-%m-%d:T%H%M")))
    return( 0 )

# Function lookup table - maps executable name to function to call
FTAB = { "holdMember" : hold,
         "unholdMember": unhold,
         "onHold": onhold,
}

#############################
#
#          main
#
#############################

def main():
    # Try to connect to the database

    Client = MongoClient( host=HOST, port=PORT,
                      username=USER, password=PASSWORD,
                      authSource=DBNAME)
    DB = Client[ DBNAME ]
    # Workaround for pymongo 3.6.? to get around the fact MongoClient
    # no longer throws connection errors.
    try:
        Client.admin.command( 'ismaster' )
    except pymongo.errors.OperationFailure as e:
        print( 'MongoDB connection failure, message:', e )
        return( 1 )

    # call the function to do operation
    r = FTAB[ FUNCNAME ]( DB, cmdArgs  )
    # close up and exit
    Client.close()
    if ( r ):
        parser.print_usage()
    return( r )

#  If module name is __main__ call the main function
if ( __name__ == "__main__" ):
    sys.exit( main() )

