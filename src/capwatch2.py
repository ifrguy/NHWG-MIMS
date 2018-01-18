#!/usr/bin/python3

## Copyright 2018 Marshall E. Giguere
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

from capwatch2_conf import *
from capwatch2_creds import *
import argparse, os, sys, json, requests, base64

"""
capwatch2.py replaces capwatch.py as the preferred downloader for
CAPWATCH zip files.  This has been made possible by the secure
download API added to eServices in January 2018.  In order to use this
utility you will need to have your WSA and Wing cmdr authorize you to
use the API, or web.  Also note that you are restricted to downloading
CAPWATCH once in a 24 hour period.
"""
# History:
# 14Jan18 MEG Created.
#

# build an argument parser, set options and defaults
parser = argparse.ArgumentParser()
parser.add_argument( '-i', default=ID, metavar='user', help='eServices login ID')
parser.add_argument( '-o', default=ORGID, type=int,
                     metavar='org', help='CAP organization number')
parser.add_argument( '-p', default=PASSWD, metavar='password',
                     help='eServices password')
parser.add_argument( '-t', default=TIMEOUT, metavar='timeout',
                     help='Time in seconds to wait for response' )
parser.add_argument( '-v', help='Verbose', action='store_true')
parser.add_argument( 'outfile', default=OUTFILE, nargs='?',
                     help='path for download')
# invoke parser
opts = parser.parse_args()

# CAPWATCH API request URL
url = 'https://www.capnhq.gov/CAP.CapWatchAPI.Web/api/cw?'

args = 'ORGID={}&unitOnly=0'.format( opts.o )

uri = url + args

# Make download request and save results
try:
    r = requests.get( uri, auth=( opts.i, opts.p), timeout=opts.t ) 
except requests.execptions.HTTPError as e:
    print( e )
    sys.exit( 1 )
except requests.exceptions.Timeout:
    print('Request: download orgid:', str( opts.o ), 'timed out.')
    sys.exit( 1 )
except requests.exceptions.RequestException as e:
    print( e )
    sys.exit( 1 )

if ( r.status_code == 200 ):
    with open( opts.outfile , 'wb' ) as f:
        f.write( r.content )
else:
    print( 'ERROR:', r.status_code, r.content )

sys.exit( r.status_code )


