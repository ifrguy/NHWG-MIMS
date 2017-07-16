# NHWG-MIMS
## NHWG Member Info Management System
## (WARNING THIS IS UNDER DEVELOPMENT)

Author: Capt Marshall Giguere

MIMS is intended to synchronize member accounts between National database and Wing accounts with the Google G-Suite platform.  Provides the following functions: Add new members, remove members no longer found on National rolls, Suspend expired member accounts until they either fall off the rolls, or renew. MIMS scans the National database and emits batch jobs to perform it's various tasks.  MIMS is intended to be platform agnostic although it is designed primarily with Linux in mind.

#### Requirements:
* O/S: Linux, Windows 7 or above*
* Python 3.0>
* [GAMADV-X](https://github.com/taers232c/GAMADV-X) Ross Scroggs excellent fork of the [GAM](https://github.com/jay0lee/GAM) tool.
* [MongoDB](https://www.mongodb.com/download-center#community) document database manager 3.4>
* [Selenium](https://pypi.python.org/pypi/selenium) Python webdriver module
* [Chrome webdriver](https://sites.google.com/a/chromium.org/chromedriver/downloads) or equivalent browser webdriver
* Google G-Suite admin account.

#### Windows additional requirements (includes all of the above)
* Cygwin environment
* Additional Cygwin tools: text-utils, bash, sed, tail, unzip

#### Suggested but not required
* [iPython](http://ipython.readthedocs.io/en/stable/index.html#) - interactive Python environment (makes life so much better for debugging)

#### Optional
* [Studio 3T](https://studio3t.com) - MongoDB browser/editor

#### Components:
* capwatch.py - CAPWATCH downloader webdriver client
* mims.py - MIMS batch job generator
* jobexec - Job executive runs jobs created by MIMS (bash script)
* getTables - Unpack CAPWATCH tables and filter for import into MongoDB (bash script)
* importGoogle - Google data downloader and mongoDB import (bash script)
* importTables - Load CAPWATCH tables into mongoDB (bash script)
* jsonfix.sed - sed (Stream Editor) script used by importGoogle.

* Note: bash script utilities have not been ported to the Windows environment yet. They may work under cygwin??

## Installation
Each component comes with either a companion configuration file, or the script header contains variables that must be set
prior to running MIMS.  At minimum before you can run MIMS you must install and configure GAMADV-X, Python3 and MongoDB. If you want to automate downloading of the tables you must install Selenium and Chrome webdriver. There is no installer for MIMS. Copy all of the MIMS components into a directory under your workspace, MIMS is a good name for it.
