#!/usr/bin/python3

# holdMember/unholdMember places a member on hold to prevent their 
# Google account from being removed, or removes the hold so the
# member account can be removed or reinstated.
# If called as holdMember inserts CAPID in Holds, adds HOLD to Member wing status field.
# If callded as unholdMember removes CAPID from Holds

# History:
# 01Jun22 MEG Fixed dangling if in "unhold()"                                   
# 01Jun22 MEG Removed deprecated db logout function call.                       
# 08Mar21 MEG Added date stamp to hold
# 02May20 MEG Set/unset Wing status on Member, check for duplicate holds on set
# 09Aug18 MEG Added on hold checking
# 15Jun18 MEG Created

import os, sys
from datetime import date, timedelta, datetime, timezone
from pymongo import MongoClient
from hold_credentials import *

# Mongo DB connection info
HOST = 'localhost'
PORT = 27017
DBNAME = 'NHWG'
PROG = os.path.basename( sys.argv[0] ).split(".")[0]
HELP = { "holdMember" : "Usage: " + sys.argv[0] + " CAPID [comment]",
         "unholdMember" : "Usage: " + sys.argv[0] + " CAPID]",
         "onHold" : "Usage: " + sys.argv[0] + "'[-h] [CAPID]",
}

# Looks reasonably like we have input, connect to the database
client = MongoClient( host=HOST, port=PORT,
                      username=USER, password=PASSWORD,
                      authSource=DBNAME)
DB = client[ DBNAME ]
# Workaround for pymongo 3.6.? to get around the fact MongoClient
# no longer throws connection errors.
try:
    client.admin.command( 'ismaster' )
except pymongo.errors.OperationFailure as e:
    print( 'MongoDB error:', e )
    exit( 1 )

def hold( db ):
    """
    Place a member account on hold to prevent removal
    """
    try:
        capid = int( sys.argv[1] )
    except IndexError:
        print("No CAPID found.")
        print( HELP[ PROG ] )
        sys.exit( 1 )
    except ValueError:
        print("CAPID to int failed:",sys.argv[1])
        print( HELP[ PROG ] )
        sys.exit( 1 )
    try:
        comment = sys.argv[ 2 ]
    except:
        comment = ""
    if ( db.Holds.find_one( { 'CAPID' : capid } )):
        print("ERROR: CAPID:", capid, "already on hold." )
        return
        
    db.Holds.insert_one( { "CAPID": capid,
                           "Comment" : comment,
                           "Date" : datetime.now() } )
    db.Member.update_one( { 'CAPID' : capid }, { '$set' : { 'NHWGStatus':
                                                            'HOLD' }} )
    return

def unhold( db ):
    """
    Remove member from hold status.
    """
    try:
        capid = int( sys.argv[1] )
    except IndexError:
        print( HELP[ PROG ] )
        sys.exit( 1 )
    except ValueError:
        print( HELP[ PROG ] )
        sys.exit( 1 )
    r = db.Holds.find_one( { "CAPID" : capid } )
    if ( r ):
        db.Holds.delete_one( { '_id' : r[ '_id' ] } )
        db.Member.update_one( { 'CAPID' : capid }, { '$set' : { 'NHWGStatus' :
                                                                None }} )
        return
    else:
        print( "Error: CAPID:", sys.argv[1], "not found." )
    return

def onhold( db ):
    """
    Print a list of members on hold, or check for a specific member.
    """
    msg = 'CAPID: {} {} {}, Comment: {} {}'
    try:
        capid = int(sys.argv[1])
        # do member lookup for hold
        h = db.Holds.find_one( {'CAPID':capid} )
        m = None
        if ( h ):
            m = db.Member.find_one( {'CAPID':capid} )
        if ( m ):
            print( msg.format( m['CAPID'],
                               m['NameFirst'],
                               m['NameLast']+m['NameSuffix'],
                               h['Comment'],
                               h['Date'].strftime("%Y-%m-%d:T%H%M")))
        else:
            print( 'Nothing found.')
    except IndexError:
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
    except ValueError:
        print( HELP[ PROG ] )
        sys.exit( 1 )
    return

# Function lookup table - maps executable name to function to call
ftab = { "holdMember" : hold,
         "unholdMember": unhold,
         "onHold": onhold,
}

# call the function to do operation

ftab[ PROG ]( DB )
# close up and exit
client.close()
