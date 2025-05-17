#!/usr/bin/env /usr/bin/python3
#
## Copyright 2025 Marshall E. Giguere
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

# Find a member or members and print all contacts
#
# Input: CAPID or first letters of last name to search for,
#        plus optional first name.
#
# History:
# 16May25 MEG Output includes mission ops qualifications
# 16May25 MEG Include WingStatus if present
# 16May25 MEG Pull unit name from orgUnitPath collection
# 05Dec24 MEG Included "RankDate" in output.
# 15Nov24 MEG Include "OrgJoined" date in output.
# 17Sep23 MEG Removed forced ^ anchor form last name pattern.
# 31Mar23 MEG Fixed bug exception if db.Squadron.Unit missing from collection
# 04Sep20 MEG Added Duty Positions to output.
# 10Oct19 MEG pymongo.Database.logout() Deprecated.
# 18Aug19 MEG Search by CAPID, better agg pipeline handling.
# 17Aug19 MEG Made parseable for data extraction by other scripts
# 15Apr19 MEG Added expiration date.
# 14May18 MEG Created.
#
import os, sys
from bson.regex import Regex
from bson.son import SON
from pymongo import MongoClient
from query_creds import *
from query_conf import *

# Aggregation pipeline
pipeline = []

try:
    pat = sys.argv[1]
except IndexError:
    print( 'Usage:', sys.argv[0], 'CAPID|[lastname', '[firstname]]' )
    print( 'Look-up a member by CAPID or lastname and optional firstname')
    print( "    CAPID - CAPID number" ) 
    print( "    lastname - Python REGEX, first letters or partial string, case insensitive" )
    print( "    firstname - Python REGEX, first letters, partial string, case insensitive" ) 
    sys.exit( 1 )

# either we got a capid or a lastname
try:
    pipeline.append( {'$match': {u'CAPID': int( pat ) }} )
except ValueError:
    pipeline.append( { u"$match": { u"NameLast": { u"$regex":  Regex( pat, u"i") }}} )
    try: 
        pat2 = sys.argv[2]
        pipeline.append( { u"$match":{ u'NameFirst': { u"$regex": Regex( pat2, u"i" ) }}} )
    except IndexError:
        pass

# Append additional operations to the pipeline
# Sort
pipeline.append( { u"$sort": SON( [ (u"CAPID", 1 ) ] ) } )
# Lookup phone and email contacts
pipeline.append( { u"$lookup": {
    u"from": u"MbrContact",
            u"localField": u"CAPID",
            u"foreignField": u"CAPID",
            u"as": u"Contacts"
            }} )
# Lookup postal addresses
pipeline.append( { u"$lookup": {
            u"from": u"MbrAddresses",
            u"localField": u"CAPID",
            u"foreignField": u"CAPID",
            u"as": u"Addresses"
            }} )
# Lookup Duty positions
pipeline.append( { u"$lookup": {
    u"from": u"DutyPosition",
    u"localField": u"CAPID",
    u"foreignField": u"CAPID",
    u"as": u"dutyPositions"
    }} )
# Ops Quals pipeline
pipeline.append( { u"$lookup": {
            u"from": u"MbrAchievements",
            u"let": {
                u"capid": u"$CAPID"
            },
            u"pipeline": [
                {
                    u"$match": {
                        u"$expr": {
                            u"$and": [
                                {
                                    u"$eq": [
                                        u"$CAPID",
                                        u"$$capid"
                                    ]
                                },
                                {
                                    u"$in": [
                                        u"$AchvID",
                                        [ 55,56,57,61,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,124,125,126,127,128,186,189,190,193,248,253,254,255,256,257,258,259,260,261,263,264,265,269 ]
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    u"$match": {
                        u"$expr": {
                            u"$or": [
                                {
                                    u"$eq": [
                                        u"$Status",
                                        u"ACTIVE"
                                    ]
                                },
                                {
                                    u"$eq": [
                                        u"$Status",
                                        u"TRAINING"
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    u"$lookup": {
                        u"from": u"Achievements",
                        u"let": {
                            u"qualID": u"$AchvID"
                        },
                        u"pipeline": [
                            {
                                u"$match": {
                                    u"$expr": {
                                        u"$eq": [
                                            u"$AchvID",
                                            u"$$qualID"
                                        ]
                                    }
                                }
                            }
                        ],
                        u"as": u"qual"
                    }
                },
                {
                    u"$unwind": u"$qual"
                },
                {
                    u"$project": {
                        u"_id": 0,
                        u"AchvID": 1,
                        u"Status": 1,
                        u"Qualification": u"$qual.Achv",
                        u"Expiration": 1
                    }
                }
            ],
            u"as": u"Qualifications"
        }
    }
)


#print( len( pipeline ))
#for i in pipeline:
#    print( i )
#exit(1)
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
    sys.exit( 1 )

# print format templates
heading = '{0}: {1}, {2} {3} {4}'
f2 = "        {0}: {1} Priority: {2}"
f3 = "        {0}: {1}"
f4 = '        Google account: {0}'
f5 = "    {0}: {1}"
f6 = "        Duty: {0}, Level: {1}, Area: {2}"
fqual = "        {0}, Expiration: {1}"

# run the aggregation query to find member contacts
cur = DB.Member.aggregate( pipeline, allowDiskUse = False )
# unwind it all
for m in cur:
    print( heading.format( 'Member', m['NameLast'], m['NameFirst'],
                        m['NameMiddle'], m['NameSuffix'] ))
    print( f5.format( 'CAPID', m['CAPID'] ))
    print( f5.format( 'Type', m['Type'] ))
    print( f5.format( 'Status', m['MbrStatus'] ))
    try:
        print( f5.format( 'Wing Status', m['WingStatus'] ))
    except KeyError:
        print( f5.format( 'Wing Status', '--Not set--' ))
    print( f5.format( "Rank", m['Rank'] ))
    print( f5.format( "Rank Date", m['RankDate'] ))
    u = DB.orgUnitPath.find_one( { 'Unit' : m['Unit'] } )
    if ( u ):
        print( f5.format( "Unit", m['Unit'] + " " +u['Name'] ))
    else:
        print( f5.format( "Unit", m['Unit'] + " " +u'Unit::missing or corrupt' ))
    print( f5.format( "Joined CAP", m['OrgJoined'] ))
    print( f5.format( "Expiration", m['Expiration'] ))
    print( "    Member Contacts:" )
    g = DB.Google.find_one( {'customSchemas.Member.CAPID' : m['CAPID']} )
    if g :
        print( f4.format( g[ 'primaryEmail' ] ) )
    else:
        print( f4.format( "NONE" ))
    for j in m['Contacts']:
        print( f2.format(j['Type'], j['Contact'], j['Priority']))
    print( "    Member Addresses:" )
    for k in m['Addresses']:
        print( f3.format( k['Type'], k['Priority'] ))
        print( f3.format( 'Addr1', k['Addr1'] ))
        print( f3.format( 'Addr2', k['Addr2'] ))
        print( f3.format( 'City', k['City'] ))
        print( f3.format( 'State', k['State'] ))
        print( f3.format( 'Zipcode', k['Zip'] ))
    print( u"    Duty Positions:" )
    if ( len(m[ 'dutyPositions' ]) > 0 ):
        for d in m[ 'dutyPositions' ]:
            print( f6.format(
                d[ 'Duty' ] if d[ 'Asst' ] == 0 else "Asst " + d [ 'Duty' ],
                d[ 'Lvl' ],
                d[ 'FunctArea' ] ))
    else:
            print( "        NONE" )

# Get member Ops Quals
    print( "    Ops Quals - Active:" )
    if ( len( m['Qualifications'] ) > 0 ):
        for d in m['Qualifications']:
            print( fqual.format( d['Qualification'],
#                                 d['Status'],
                                 d['Expiration']
            ))
    else:
        print("\t\tNONE" )
    
client.close()
sys.exit( 0 )
