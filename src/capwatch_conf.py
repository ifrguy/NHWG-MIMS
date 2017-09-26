
# CAPWATCH downloader config variables

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
