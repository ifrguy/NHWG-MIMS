"""
Configuation options for CAPWatch2 downloader

WARNING: You must change the None values to the appropriate values.

These options may be overridden by commandline options.

"""
import os

# Number of attempts to try and download CAPWATCH before giving up.
TRIES = 5

# Fully qualified output filename
OUTFILE = None

# The default organization to download. This is the CAP OrgId.
ORGID = None


# Request timeout, how long to wait for response
TIMEOUT = 120
