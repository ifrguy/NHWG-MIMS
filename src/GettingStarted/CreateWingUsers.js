// This script creates the basic MongoDB users for the Wing DB
// NOTE: passwords are blank, you really need to change passwords
//       before going to production.

// Change this to the actual database name you want to use.
// If wingName DB does not exist Mongo will create it.
// Example: wing name is "New Hampshire Wing" -> "NHWG"
let wingName = "Your Wing DB name here";

use wingName;

// Users
// These users are authenticated at the wingName db level not the db admin
// level, i.e. the authenticate against wingName not admin.

const Users = [
    { // The Wing level DB admin account only not server level admin
	"User" : "dba",
	"pwd" : "",
	"customData" : {

	},
	"roles" : [
            {
		"role" : "dbAdmin",
		"db" : wingName
            },
            {
		"role" : "dbOwner",
		"db" : wingName
            },
            {
		"role" : "userAdmin",
		"db" : wingName
            },
            {
		"role" : "readWrite",
		"db" : wingName
            }
	]
    },
    {
	"User" : "MIMS",
	"pwd" : "",
	"customData" : {

	},
	"roles" : [
            {
		"role" : "readWrite",
		"db" : wingName
            }
	]
    },
    {
	"User" : "MIMSImporter",
	"pwd" : "",
	"customData" : {

	},
	"roles" : [
            {
		"role" : "readWrite",
		"db" : wingName
            }
	]
    },
    {
	"User" : "Query",
	"pwd" : "",
	"customData" : {

	},
	"roles" : [
            {
		"role" : "read",
		"db" : wingName
            }
	]
    },
    {
	"User" : "groupMgr",
	"pwd" : "",
	"customData" : {

	},
	"roles" : [
            {
		"role" : "read",
		"db" : wingName
            }
	]
    },
    {
	"User" : "holdmgr",
	"pwd" : "",
	"customData" : {

	},
	"roles" : [
            {
		"role" : "Member Holds",
		"db" : wingName
            },
            {
		"role" : "read Member",
		"db" : wingName
            },
            {
		"role" : "readWriteMember",
		"db" : wingName
            }
	]
    },
    {
	"User" : "reporter",
	"pwd" : "",
	"customData" : {

	},
	"roles" : [
            {
		"role" : "Reporter",
		"db" : wingName
            }
	]
    },
    { // Optional account used by optional ReadOps app
	"User" : "ReadyOps",
	"pwd" : "",
	"customData" : {

	},
	"roles" : [
            {
		"role" : "ReadyOps",
		"db" : wingName
            }
	]
    },
];

// loop over the Users and create each one here.

Users.forEach( user => db.createUser( user ));
