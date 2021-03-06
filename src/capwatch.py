#!/cygdrive/c/Program Files/Python35/python
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


# CAPWATCH - use chrome browser to connect to eServices and download
# CAPWATCH file.
#
# History:
# 24Sep17 MEG - Added virtual framebuffer support of background operation.
# 20Sep17 MEG - Delete CAPWATCH file before start. Wait for download to finish.
# 22Jan17 MEG - Created
#

import os, sys, time
from capwatch_conf import *

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ExC

# Create virutal display buffer for Chrome, requires Linux and xvfb
if BATCH & (sys.platform == 'linux'):
    from pyvirtualdisplay import Display
    display = Display(visible=0, size=(800,600))
    display.start()

argv = sys.argv

# check if caller wishes to download a UNIT other than the default
if len(argv) > 1:
    UNIT = 'NER-NH-' + argv[1]

# kill previous CAPWATCH download if it exists
try:
    os.remove( DL_FILEPATH )
except FileNotFoundError:
    pass

#opts = webdriver.ChromeOptions()
#opts.add_argument( 'headless' )
#opts.add_argument( 'window-size=1200x600' )
# create a browser instance
www = webdriver.Chrome()
#www = webdriver.Chrome( chrome_options=opts )
# How long to wait for an element to appear in the DOM
www.implicitly_wait( DOM_TIMEOUT )

try:
    www.get('https://www.capnhq.gov')
    print("Connecting to eServices")
except:
    print('Unable to connect to eServices!')
    www.close()
    sys.exit( 1 )

# login to eServices
print('Logging in to eServices')
uid = www.find_element_by_id('UserName')
uid.send_keys( UID )
pwd = www.find_element_by_id('Password')
pwd.send_keys( PASSWD )
www.find_element_by_name('Login1$LoginButton').click()

# go to the CAPWATCH download page
try:
    www.get('https://www.capnhq.gov/cap.capwatch.web/download.aspx')
except:
    print("Failed to login to eServices")
    www.close()
    sys.exit( 1 )

# choose UNIT and request file
print('Selecting Unit to download:',UNIT)
select=Select(www.find_element_by_name('ctl00$MainContentPlaceHolder$OrganizationChooser1$ctl00'))
select.select_by_visible_text( UNIT )
# find the submit button and click it
www.find_element_by_id('ctl00_MainContentPlaceHolder_btnSubmit').click()

# get session cookies
sessionID = www.get_cookie( 'ASP.NET_SessionID' )
capauth = www.get_cookie( '.CAPAUTH' )

try:
    print('Downloading CAPWATCH file...')
    (WebDriverWait( www, DOM_TIMEOUT ).until(
        ExC.presence_of_element_located((By.PARTIAL_LINK_TEXT, 'Download'))
    )).click()
finally:
    # wait for download to finish
    print('Waiting for download to complete...')
    while ( os.path.exists( DL_FILEPATH ) == False ):
        time.sleep( TIMEOUT )

# Finish and logout
print('Download completed logging out of eServices')
sout=www.find_element_by_partial_link_text('Sign Out').click()

# close browser
www.close()
print('Browser session closed.')

if BATCH & (sys.platform == 'linux'):
    display.stop()

