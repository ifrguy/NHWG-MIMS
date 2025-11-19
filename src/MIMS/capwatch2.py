#!/usr/bin/python3

## Copyright 2025 Marshall E. Giguere
##
##   Licensed under the Apache License, Version 2.0 (the "License");
##   you may not use this file except in compliance with the License.
##   You may obtain a copy of the License at
##
##       https://www.apache.org/licenses/LICENSE-2.0
##
##   Unless required by applicable law or agreed to in writing, software
##   distributed under the License is distributed on an "AS IS" BASIS,
##   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
##   See the License for the specific language governing permissions and
##   limitations under the License.

from capwatch2_conf import *
from capwatch2_creds import *
import argparse, os, sys, json, requests, base64, time

"""
capwatch2.py replaces capwatch.py as the preferred downloader for
CAPWATCH zip files.  This has been made possible by the secure
download API added to eServices in January 2018.  In order to use this
utility you will need to have your WSA and Wing cmdr authorize you to
use the API, or web.  Also note that you are restricted to downloading
CAPWATCH once in a 24 hour period.
"""
# History:
# 19Nov25 MEG Changed return exit codes for systemd compatibility.
# 15Jan20 MEG fixed retry count down error.
# 14Feb19 MEG Moved retry control var's to conf file.
# 28Nov18 MEG download() timeout throws error, no request packet returned.
# 24Aug18 MEG Added catch requests Read time out exception
# 10Aug18 MEG Auto retries on failure up to TRIES times.
# 14Jan18 MEG Created.
#

# build an argument parser, set options and defaults
parser = argparse.ArgumentParser()
parser.add_argument( '-i', default=ID, metavar='user',
                     help='eServices login ID (' + ID + ')' )
parser.add_argument( '-o', default=ORGID, type=int,
                     metavar='org', help='CAP organization number (' + str(ORGID) + ')')
parser.add_argument( '-p', default=PASSWD, metavar='password',
                     help='eServices password')
parser.add_argument( '-r', default=TRIES, type=int,
                     metavar='retries',
                     help='Number of times to try download (' + str(TRIES) +')')
parser.add_argument( '-t', default=TIMEOUT, metavar='timeout',
                     help='Response time out in seconds (' + str(TIMEOUT) + ')' )
parser.add_argument( '-v', help='Verbose', action='store_true')
parser.add_argument( 'outfile', default=OUTFILE, nargs='?',
                     help='path for download (' + OUTFILE + ')' )
# invoke parser
opts = parser.parse_args()

if ( opts.v ): print( 'USERID:', opts.i )

# CAPWATCH API request URL
url = 'https://www.capnhq.gov/CAP.CapWatchAPI.Web/api/cw?'

args = 'ORGID={}&unitOnly=0'.format( opts.o )

uri = url + args
if ( opts.v ): print( 'URI:', uri )

def download():
    """
    Attempt to download CAPWATCH file.
    Save returned file to directory specified by caller.
    """
    if ( opts.v ): print( 'Requesting CAPWATCH for OrgID:', opts.o )
    try:
        r = requests.get( uri, auth=( opts.i, opts.p), timeout=opts.t ) 
    except requests.exceptions.ReadTimeout as e:
# Note: if the requests times out, i.e. no connection, "requests.get" returns
# no value.  The return variable is "unbound".  Attempting to access any
# of the atts of the request package with throw an UnboundLocalVarilable error.
# So we force the return of an HTTP 408 Timeout Error, so we can try again.
        print('Read: download orgid:', str( opts.o ), 'timed out.')
        print( "Error: ", e )
        print( "HTTP Error 408 - Timeout Error" )
        return 408
    except requests.exceptions.HTTPError as e:
        print( e, r.status_code, r.reason )
        return r.status_code
    except requests.exceptions.Timeout:
        print('Request: download orgid:', str( opts.o ), 'timed out.')
        return r.status_code
    except requests.exceptions.RequestException as e:
        print( e, r.status_code, r.reason )
        if ( opts.v ): print("HTTP request returned status code:", r.status_code )
        return r.status_code

    if ( r.status_code == 200 ):
        if ( opts.v ):
            print( 'Request Code:{} downloading to: {}'.format(
                   r.status_code,
                   opts.outfile ))
        with open( opts.outfile , 'wb' ) as f:
            f.write( r.content )
        if ( opts.v ): print( 'Download Complete.' )
        return 0
    else:
        print( 'ERROR:', r.status_code, r.content )
        return r.status_code

# Make download request and save results, if fail try for opts.r+1 times.
for i in range( 1, opts.r + 1 ):
    if ( opts.v ): print( 'Try #:', i )
    ret = download()
    if ret == 200:
        break
    if i < opts.r:
        time.sleep( RETRY_DELAY_TIME )

if ( opts.v ): print( 'Done.' )
sys.exit( ret )
