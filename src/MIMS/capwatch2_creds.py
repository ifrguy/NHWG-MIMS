"""
eServices login credentials for CAPWATCH download API

Note: this file should only be accessible to the owner. Change
your premissions to restrict access.

"""

import os

# Read the configuration file
import json
with open('credentials.json') as f:
  CONFIGURATION = json.load(f)

# capwatch access credentials
ID     = CONFIGURATION["capwatch"]["user"]
PASSWD = CONFIGURATION["capwatch"]["password"]
