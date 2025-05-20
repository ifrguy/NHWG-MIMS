// This script creates the DB root level admin users.

use admin;
const Users = [
    {
	"User" : "dba",  // Root db admin
	"pwd" : "",
	"customData" : {

	},
	"roles" : [
            {
		"role" : "clusterManager",
		"db" : "admin"
            },
            {
		"role" : "restore",
		"db" : "admin"
            },
            {
		"role" : "hostManager",
		"db" : "admin"
            },
            {
		"role" : "clusterMonitor",
		"db" : "admin"
            },
            {
		"role" : "root",
		"db" : "admin"
            },
            {
		"role" : "__queryableBackup",
		"db" : "admin"
            },
            {
		"role" : "clusterAdmin",
		"db" : "admin"
            },
            {
		"role" : "backup",
		"db" : "admin"
            },
            {
		"role" : "readWriteAnyDatabase",
		"db" : "admin"
            },
            {
		"role" : "dbAdminAnyDatabase",
		"db" : "admin"
            },
            {
		"role" : "enableSharding",
		"db" : "admin"
            },
            {
		"role" : "dbOwner",
		"db" : "admin"
            },
            {
		"role" : "__system",
		"db" : "admin"
            },
            {
		"role" : "userAdminAnyDatabase",
		"db" : "admin"
            }
	]
    },
    {
	"User" : "backup",  // This user handles full db back up.
	"pwd" : "",
	"customData" : {

	},
	"roles" : [
            {
		"role" : "backup",
		"db" : "admin"
            }
	]
    },
];

// create admin level users

Users.forEach( user => createUser( user ));
