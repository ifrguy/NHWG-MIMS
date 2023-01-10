The files in this directory define a set of JavaScript classes that
are responsible for managing the members of various Workspace groups.
The top level class, super class,  **Group.js** all group classes must
invoke the super constructor.  Each subclass must define an
appropriate MongoDB aggregation pipeline to select potential group
members as well as declaring the group name, domain, and starting
collection for member selection.

#### Subordinate unit groups
Subordinate unit groups may managed if desired.  Each subordindate
unit must subscribe to each managed group class.  Currently only:
Seniors, Cadets, and Parents groups are supported.  By necessity each
unit must be an active subdomain under the top level Workspace
customer domain.  As an example if the top level domain is
"wing.cap.gov" then a unit might have a subdomain such as
"subunit.wing.cap.gov".  Unit subscriptions are recorded in the
**2updateUnitGroup.conf** file.  Unit groups are subclasses of the
**Group.js** super class.  For examples see the classes in the
**./Unit** subdirectory, all other requirements are the same as for
wing level group classes.
