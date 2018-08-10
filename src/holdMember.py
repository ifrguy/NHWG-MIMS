#!/usr/bin/python3

# holdMember/unholdMember places a member on hold to prevent their 
# Google account from being removed, or removes the hold so the
# member account can be removed or reinstated.
# If called as holdMember inserts CAPID in Holds collection.
# If callded as unholdMember removes CAPID from Holds collection.
# If called as onHold lists members or a specifided member on hold.
#
# To use the unholdMember and onHolds feature create symlinks to holdMember.py

# History:
# 09Aug18 MEG Added on hold checking
# 15Jun18 MEG Created

import os, sys
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
        print( HELP[ PROG ] )
        sys.exit( 1 )
    except ValueError:
        print( HELP[ PROG ] )
        sys.exit( 1 )
    try:
        comment = sys.argv[ 2 ]
    except:
        comment = ""
    db.Holds.insert( { "CAPID": capid, "Comment" : comment } )
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
        return
    print( "Error: CAPID:", str( capid ), "not found." )
    return

def onhold( db ):
    """
    Print a list of members on hold, or check for a specific member.
    """
    msg = 'CAPID: {} {} {}, Comment: {}'
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
                               h['Comment']))
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
                                   h['Comment']))
            else:
                print( msg.format( h['CAPID'], 'Unknown', 'Unknown',
                                   h['Comment']))
    except ValueError:
        print( HELP[ PROG ] )
        sys.exit( 1 )
    return

# Function lookup table
ftab = { "holdMember" : hold,
         "unholdMember": unhold,
         "onHold": onhold,
}

# call the function to do operation

ftab[ PROG ]( DB )
# close up and exit
DB.logout()
client.close()
