# NHWG-MIMS
## NHWG Member Info Management System
## (WARNING THIS IS UNDER DEVELOPMENT)

MIMS is intended to synchronize member accounts between National
database and Wing accounts on the Google WorkSpace platform. MIMS
provides the following functions: Add new members, remove members no
longer found on National rolls, Suspend expired member accounts until
they either fall off the rolls, or renew. MIMS scans the National
database and emits batch jobs to perform it's various tasks.  In addition to pure member account management MIMS also provides some
automatically generated reports. Reports are provided as CSV formatted
files for spreadsheet import. MIMS also provides a Group manager to
manage both wing and unit level Google groups. MIMS is
intended to be platform agnostic although it is designed primarily
with Linux in mind. 

MIMS uses Google custom schemas to more easily track member
information like CAPID, Unit and member Type.  This has been done as
it is not possible to update a single attribute in the Google
"organizations" schema, you must update the entire schema or lose
data not supplied.  Custom schemas allow individual attributes to be
updated without disturbing existing information.

#### Processing environment ####
MIMS has been specifically designed as a *batch* only system.  There
are no fancy GUI's, no point-and-click web interfaces.  It is bare
bones grunt level batch processing.  From the importing of data to the
processing of jobs everything is controlled by a few scripts.  The
scripts have been designed to be used with a scheduler, i.e. cron or
its equivalent, or directly from the command line.  Once scheduled
everything is automatic, although some jobs like purging members are
put on hold and require an administrator to review them before
releasing them.  Jobs can be scheduled to run as frequently as you
like.  MIMS can be run on either a local dedicated server or a cloud
instance.  I personally use a Linux cloud instance reachable only via
a secure and encrypted connection.

The design of the MIMS processing environment is minimal in terms of
additional requirements. It is deliberately implemented without the
necessity to hunt down and install lots of additional development
packages or environments.  Everything is programmed as close to the
operating system and environment as possbile to achieve that goal, so
you will find everthing MIMS does is composed of MonogDB JS code,
using Mongo shell (mongosh), mediated and managed by bash shell
scripts, and member management is housed in a single Python
application. Finally using shell scripts that are runnable directly
was purposeful in allowing recovery from failed tasks and operations.

You may consider MIMS as a demonstration of how to manage your Google
Workspace users and other tasks.  Use it out of the box, just add some
upfront work to understand it, and get it up and running.  Or, you may
think of it as an inspirational guide to dive into the challenges of
automating your day-to-day Workspace management tasks.  Either way is
fine.  The hours developing MIMS were spent in order to save hours of
tedious labor keeping our Workspace up to date and running smoothly.
I have not regretted it.  "Share and enjoy."

#### Note: ####

MongoDB JS scripts have been updated to work with the newer Mongo
Shell (mongosh) 1.5>

#### Requirements:
* O/S: Linux (if you choose to use Windows I suggest installing cygwin)
* Python 3.5>
* [GAM7](https://github.com/GAM-team/GAM)
* [MongoDB](https://www.mongodb.com/download-center#community) document database manager 5.0>
* Mongo Shell (mongosh) 1.5>
* Google Workspace admin account.

#### Windows additional requirements (includes all of the above)
* Cygwin environment
* Additional Cygwin tools: text-utils, bash, sed, tail, unzip

#### Suggested but not required
* [iPython](http://ipython.readthedocs.io/en/stable/index.html#) - interactive Python environment (makes life so much better for debugging)

#### Optional
* [Studio 3T](https://studio3t.com) - MongoDB browser/editor

Note: Studio 3T is free for non-commercial use.  I highly suggest
purchasing Pro edition licenses if you are serious about development
and maintenance.  Pro licenses are available to CAP at the non-profit
pricing level.

#### Components:
* capwatch2.py - CAPWATCH downloader uses the new download API.
* mims.py - MIMS batch job generator
* jobexec - Job executive runs jobs created by MIMS (bash script)
* getTables - Unpack CAPWATCH tables and filter for import into MongoDB (bash script)
* holdMember - put member accounts on hold to prevent removal by MIMS, remove or list held accounts.
* importGoogle - Google data downloader and mongoDB import, index collection script included (bash script)
* importTables - Load CAPWATCH tables into mongoDB, index collections script included (bash script). Allows execution of pre & post MongoDB JS scripts on a per-collection basis. Script naming convention is
TableName-[pre|post].js, e.g. "DutyPosition-pre.js".  If a script is found it is automatically run, if no script is found no pre/post ops are preformed and the table is imported directly.  Scripts must be located in the same directory as importTables.
* jsonfix.sed - sed (Stream Editor) script used by importGoogle.
* MIMSJobsGen - bash convinence script to generate GAM job files for a list of MIMS classes.
* mongodb-seed - Mongo shell script to create empty database and base collections.

* Note: bash script utilities have not been ported to the Windows environment yet. They work with cygwin bash shell.

## Installation
Each component comes with a companion configuration file must be set
prior to running MIMS.  At minimum before you can run MIMS you must
install and configure GAMADV-XTD3, Python3 and MongoDB. There is no
installer for MIMS. Copy all of the MIMS components into a directory
under your workspace, MIMS is a good name for it.  Once installed you
will need to update the configuation files, credential files and bash
shell scripts with defaults appropriate to your installation.  Config
vars for the bash scripts are located *.conf* file for each main
script, e.g. importGroups conf file is importGroups.conf. Python files
will have a conf file and possibly a credentials file,
e.g. capwatch2.py includes capwatch2_creds.py and
capwatch2_conf.py. You will need to examine the *mims_conf.py* file
and set each configuration variable as necessary.

MIMS uses **capwatch2.py** to download CAPWATCH data from
eServices.  The eServices release included a PowerShell
implementation, capwatch2.py is a Python 3 rewrite and platform
agnostic. **NOTE:** you will need to have your WSA and wing commander
authorize your use of the api, and web interface.

## Additional Python modules required:
* pymongo

Python modules may be installed using Python pip: pip install module_name

## Additional JavaScript libs
* [Date-fns](https://date-fns.org/docs/Getting-Started) - JavaScript date calculations library.
