"""
Configuation options for CAPWatch2 downloader

WARNING: You must change the None values to the appropriate values.

These options may be overridden by commandline options.

"""
import os

# Fully qualified output filename
OUTFILE = None

# The default organization to download. This is the CAP OrgId.
ORGID = None

# Default retry and connection control values

# Number of attempts to download CAPWATCH file                                                                                                                  
TRIES = 5                                                                       
                                                                                
# Time to wait between retries in seconts                                       
RETRY_DELAY_TIME = 30                                                           
                                                                                
# Max time to wait for TCP connection to time out in seconds                    
TIMEOUT = 120                                                                   
