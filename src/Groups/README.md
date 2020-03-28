This contains a collection of scripts to manage groups for various member sets.
The scripts here are intended to be run as batch jobs, but can be run directly
from the command line if desired.;

A dump of all Wing G Suite groups is pulled regularly and saved in the
GoogleGroups collection.  The bash script reads a Mongo shell
javascript script and produces an output file containing a series of GAM commands to update the specified group.

#### Naming convention:
Each group to be updated may have either one or more MongoDB javascript files
associated.  By convention the root name of the script should be the
email name for the group, e.g. aircrew@nhwg.cap.gov group update
script is aircrew.js.  It is also possible to have different scripts
one say to add new members and one to remove lapsed members.  It is
purely a design choice.

#### Operation:
In operation each group to be updated must have it's update script(s)
called as a cron job on whatever schedule is desired.  As an example I
update the senior members group weekly in cron using the entry:

`* 12 * * 7 echo "Weekly all seniors list update";cd $GROUPS;./updateGroup allseniors.js`

Do the above for each group to be updated.

#### Scripts:
* updateGroup - bash group update job generator
* updateGroup.conf - updateGroup configuration file
* groupmanager.creds - MongoDB login credentials
* allcadets.js - updates the all cadets group
* allseniors.js - updates the all seniors group
* aps.js - updates the airborne photographers group.
* aircrew.js - update the aircrew group.
* commanders.js - update the wing/unit commanders group

