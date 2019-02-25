#!/usr/bin/env /usr/bin/python3
#
# Find a member or members and print all contacts
#
# Input: first letters of last name to search for,
#        plus optional first name.
#
# History:
# 14May18 MEG Created.
#
import os, sys
from bson.regex import Regex
from bson.son import  SON
from pymongo import MongoClient
from query_creds import *
from query_conf import *

try:
    pat = u'^' + sys.argv[1]
except IndexError:
    print( 'Usage:', sys.argv[0], 'lastname', '[firstname]' )
    print( "\tlastname - first letters, partial string, case insensitive" ) 
    print( "\tfirstname - first letters, partial string, case insensitive" ) 
    sys.exit( 0 )

pat2 = None
FIRSTNAME = None

try: 
    pat2 = u'^' + sys.argv[2]
except IndexError:
    pass
# if we got a first name build an agg pipeline match object
if ( pat2 ):
    FirstName = { u"$match":{ u'NameFirst': { u"$regex": Regex( pat2, u"i" ) }}}

# Mongo aggregations pipeline
pipeline = [
    { u"$match":
      { u"NameLast": { u"$regex":  Regex( pat, u"i") }}
    },
    {
#       u"$sort": {'CAPID':1}
       u"$sort": SON( [ (u"CAPID", 1 ) ] ) # key order preserved
    },
    {
        u"$lookup": {
            u"from": u"MbrContact",
            u"localField": u"CAPID",
            u"foreignField": u"CAPID",
            u"as": u"Contacts"
            }
    },
    {
        u"$lookup": {
            u"from": u"MbrAddresses",
            u"localField": u"CAPID",
            u"foreignField": u"CAPID",
            u"as": u"Addresses"
            }
    }
]

if ( pat2 ): pipeline[1]=FirstName

# setup db connection
client = MongoClient( host=Q_HOST, port=Q_PORT,
                      username=USER, password=PASS,
                      authSource=Q_DB)
DB = client[ Q_DB ]

# Workaround for pymongo 3.6.? to get around the fact MongoClient
# no longer throws connection errors.
try:
    client.admin.command( 'ismaster' )
except pymongo.errors.OperationFailure as e:
    print( 'MongoDB error:', e )
    exit( 1 )

# print format templates
f1 = '{0}: {1}, {2} {3} - {4}:'
f2 = "\t\t{0}: {1}, Priority: {2}"
f3 = "\t\t{0}: {1}"
f4 = '\t\tGoogle account: {0}'
f5 = "\t{0}: {1}"

# run the aggregation query to find member contacts
cur = DB.Member.aggregate( pipeline, allowDiskUse = False )
# unwind it all
for m in cur:
    print( f1.format(m['CAPID'], m['NameLast'], m['NameFirst'],
                     m['NameSuffix'], m['Type']))
    print( f5.format( 'Status', m['MbrStatus'] ))
    print( "\tRank:", m['Rank'] )
    u = DB.Squadrons.find_one( { 'Unit' : int( m['Unit'] ) } )
    print("\tUnit:", m['Unit'], u['SquadName'] )
    print( "\tMember Contacts:" )
    g = DB.Google.find_one( {'externalIds.value' : m['CAPID']} )
    if g :
        print( f4.format( g[ 'primaryEmail' ] ) )
    else:
        print( f4.format( "NONE" ))
    for j in m['Contacts']:
        print( f2.format(j['Type'], j['Contact'], j['Priority']))
    print( "\tMember Addresses:" )
    for k in m['Addresses']:
        print( f3.format( k['Type'], k['Priority'] ))
        print( f3.format( 'Addr1', k['Addr1'] ))
        print( f3.format( 'Addr2', k['Addr2'] ))
        print( f3.format( 'City', k['City'] ))
        print( f3.format( 'State', k['State'] ))
        print( f3.format( 'Zipcode', k['Zip'] ))

DB.logout()
client.close()
