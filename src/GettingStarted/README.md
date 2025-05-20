This directory contains a scripts to help you get your MongoDB set
up.  Scripts included create the database and collections,
administrative users and database users along with roles and
permissions. These scripts are intended to be used only after you have
installed MongoDB and have it running with security *disabled*.  This
is necessary to do the initial creation of the database, users and
roles.  Once you have accomplished this and verified that the
database, users, roles and collections are in place you can enable
security and restart the MongoDB daemon.  Once restarted you can only
connect to the database as an authenticated user.

*You must edit each script to set the database name before use.*

See: [MongoDB Installation and
Setup](https://github.com/ifrguy/NHWG-MIMS/wiki/MongoDB-Installation-and-Setup)
on the wiki.

#### Start-up Scripts
* **mongodb-seed.js** - Create the database and collections
* **CreateAdminUsers.js** - Create root level administration users
* **CreateWingRoles.js** - Create application level roles and their privileges
* **CreateWingUsers.js** - Create the application users and DBA
