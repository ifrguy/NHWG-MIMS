"""
Hold/UnHold operator credentials.

When creating a db user account to manage holds it is advised
that you create the account with roles limited to updating/writing on
the Holds collection and find only on the Member collection.
"""
# Read the configuration file
import json
with open('credentials.json') as f:
  CREDENTIALS = json.load(f)

USER = CREDENTIALS.mims.user
PASSWORD = CREDENTIALS.mims.password
