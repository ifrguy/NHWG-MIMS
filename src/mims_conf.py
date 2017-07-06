"""
MIMS Configuration File
"""
# Mongo DB host options
MIMS_HOST = 'localhost'
MIMS_PORT = 27017
MIMS_DB = 'NHWG'
MIMSUSER = 'MIMS'
MIMSPASS = '********'

# Default action for Expired members
EXPIRED_ACTION = 'suspend'

# Default action for ex-members, no longer on eSerives rolls
PURGE_ACTION = 'suspend'

# Flag to remove purged members from NHWG.Google collection
DELETE_PURGED=False

# Where to save output
LogFilePath = "./log/"
JobFilePath = "./job/"

# Welcome message template file path
WELCOMEMSG = "./email-template.txt"
