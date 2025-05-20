This contains a collection of scripts to manage groups for various
member sets.  The scripts here are intended to be run as batch jobs,
but can be run directly from the command line if desired.  New groups
may be added by simply defining new group classes.

A dump of all Wing Google Workspace groups is pulled regularly and
saved in the GoogleGroups collection.  The bash script reads a Mongo
shell javascript script and produces an output file containing a
series of GAM commands to update the specified group.

*You must edit all* **.conf** *files with values appropriate to your installation.*


#### Naming convention:

Each group to be updated must be defined by a  MongoDB
javascript class file in ./lib.  By convention the name of the
script reflects the name of the group, e.g. aircrew group
class script is Aircrew.js.  It is also possible to have different
scripts one say to add new members and one to remove lapsed members.
It is purely a design choice.

#### Operation:
In operation each group to be updated must have it's update script
called. This can be scheduled as a cron job on whatever schedule is
desired.  As an example I update the list of all wing senior members
group weekly in cron using the entry:

`* 12 * * 7 echo "Weekly all seniors list update";cd $GROUPS;./2updateGroup AllSeniors.js`

This will run the update for the allseniors group at noon on the
seventh day of eack week. Do the above for each group to be updated.

#### Adding a new group:
To define a new group what is necessary is a MongoDB aggregation
pipeline to select potential group members. The aggregation pipeline
along with the group name and starting DB collection are placed in a
new group class file.  See the template class file in the ./lib directory.

#### Scripts:
* 2updateWingGroup - update a single wing level group type
* 2updateWingGroup.conf - configuration file
* 2doAllWingGroups -  update all wing level groups calls 2updateWingGroup
* 2doAllUnitGroups - update all unit level groups calls 2updateUnitGroup
* 2updateUnitGroup - update a single unit level group type for all units.
* 2updateUnitGroup.conf - configuration file
* 2updateOneUnitGroup - update a single unit level group type for list of units.
* 2updateOneUnitGroup.conf - configuration file
* groupmanager.creds - MongoDB login credentials


