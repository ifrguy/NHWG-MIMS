This contains a collection of scripts to manage groups for various member sets.
The scripts here are intended to be run as batch jobs, but can be run directly
from the command line if desired.

A dump of all Wing G Suite groups is pulled regularly and saved in the GoogleGroups
collection.  The bash script reads a Mongo shell javascript script and produces
an output file containing a series of GAM commands to update the specified group.

#### Scripts:
* updateGroup - bash group update job generator
* updateGroup.conf - updateGroup configuration file
* groupmanager.creds - MongoDB login credentials
* allcadets.js - updates the all cadets group
* allseniors.js - updates the all seniors group
* commanders.js - update the wing/unit commanders group

