"""
Configuation options for CAPWatch2 downloader

These options may be overridden by commandline options.

"""
import os

# Read the configuration file
import json
with open('config.json') as f:
  CONFIGURATION = json.load(f)

# Internal-use variables
# See config.json for comments documenting each of these
OUTFILE          = CONFIGURATION["capwatch"]["outfile"]
ORGID            = CONFIGURATION["capwatch"]["orgId"]
TRIES            = CONFIGURATION["capwatch"]["tries"]
RETRY_DELAY_TIME = CONFIGURATION["capwatch"]["retryDelayTime"]
TIMEOUT          = CONFIGURATION["capwatch"]["timeout"]
