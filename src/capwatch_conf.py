
# CAPWATCH downloader config variables
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


# ID for eServices account Login
UID = ''

# eServices password
PASSWD = ''

# Unit default
UNIT = 'NER-NH-001'

# Fully qualified path name for downloaded CAPWATCH zipfile
DL_FILEPATH = ''

# Timeout value for download - how long to wait for file exsits
TIMEOUT = 5

# How long to wait for an HTML DOM element to appear in webdriver
DOM_TIMEOUT = 50

# If you are running on Linux and have installed the xvfb, pyvirtdisplay
# packages you can run capwatch.py in the background wo/display. Otherwise
# webdriver requires a display to render the DOM on.
BATCH = False
