#!/usr/bin/python3

# CAPWATCH - use chrome browser to connect to eServices and download
# CAPWATCH file.
#
# History:
# 22Jan17 MEG - Created
#

import os, sys, time
from capwatch_conf import *

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ExC

argv = sys.argv

# check if caller wishes to download a UNIT other than the default
if len(argv) > 1:
    UNIT = 'NER-NH-' + argv[1]

# create a browser instance
www = webdriver.Chrome()
# How long to wait for an element to appear in the DOM
#www.implicit_wait( DOM_TIMEOUT )
www.get('https://www.capnhq.gov')
assert "eServices Sign In" in www.title

# login to eServices
uid = www.find_element_by_id('UserName')
uid.send_keys( UID )
pwd = www.find_element_by_id('Password')
pwd.send_keys( PASSWD )
www.find_element_by_name('Login1$LoginButton').click()

# go to the CAPWATCH download page
www.get('https://www.capnhq.gov/cap.capwatch.web/download.aspx')
assert "CAPWATCH Download" in www.title

# choose UNIT and request file
select=Select(www.find_element_by_name('ctl00$MainContentPlaceHolder$OrganizationChooser1$ctl00'))
select.select_by_visible_text( UNIT )
# find the submit button and click it
www.find_element_by_id('ctl00_MainContentPlaceHolder_btnSubmit').click()

# get session cookies
sessionID = www.get_cookie( 'ASP.NET_SessionID' )
capauth = www.get_cookie( '.CAPAUTH' )

#download the data file
#dl = www.find_element_by_partial_link_text('Download').click()
try:
    (WebDriverWait( www, DOM_TIMEOUT ).until(
        ExC.presence_of_element_located((By.PARTIAL_LINK_TEXT, 'Download'))
    )).click()
finally:
# wait for download to finish
    time.sleep( TIMEOUT )

# Finish and logout
#sout = www.find_element_by_id('ctl00_LogoutButton').click()
sout=www.find_element_by_partial_link_text('Sign Out').click()

# close browser
www.close()
