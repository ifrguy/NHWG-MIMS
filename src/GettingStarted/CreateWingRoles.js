// This script initializes all the role and privileges for the Wing DB
// Change wingName to the name of the database for your Wing.
// Set the name for your Wing DB, e.g. New Hampshire Wing as "NHWG"

let wingName = "Your Wing DB name here;

// If wingName DB does not exist Mongo will create it.

use wingName
const Roles = [
    {
	"Role" : "Member Holds",
	"privileges" : [
            {
		"resource" : {
                    "db" : wingName,
                    "collection" : "Holds"
		},
		"actions" : [
                    "find",
                    "insert",
                    "remove",
                    "update"
		]
            }
	],
	"roles" : [

	]
    },
    {
	"Role" : "Reporter",
	"privileges" : [
            {
		"resource" : {
                    "db" : wingName,
                    "collection" : ""
		},
		"actions" : [
                    "collStats",
                    "find",
                    "listCollections"
		]
            },
            {
		"resource" : {
                    "db" : wingName,
                    "collection" : "Expired"
		},
		"actions" : [
                    "createCollection",
                    "dropCollection",
                    "find",
                    "insert",
                    "remove",
                    "update"
		]
            },
            {
		"resource" : {
                    "db" : wingName,
                    "collection" : "reportEmailList"
		},
		"actions" : [
                    "createCollection",
                    "dropCollection",
                    "find",
                    "insert",
                    "remove",
                    "update"
		]
            }
	],
	"roles" : []
    },
    {
	"Role" : "Importer",
	"privileges" : [
            {
		"resource" : {
                    "db" : wingName,
                    "collection" : ""
		},
		"actions" : [
                    "collMod",
                    "collStats",
                    "createCollection",
                    "createIndex",
                    "dbHash",
                    "dropCollection",
                    "dropIndex",
                    "emptycapped",
                    "find",
                    "indexStats",
                    "insert",
                    "killCursors",
                    "listCollections",
                    "listDatabases",
                    "listIndexes",
                    "reIndex",
                    "remove",
                    "update",
                    "validate"
		]
            }
	],
	"roles" : [

	]
    },
    {
	"Role" : "read Member",
	"privileges" : [
            {
		"resource" : {
                    "db" : wingName,
                    "collection" : "Member"
		},
		"actions" : [
                    "find"
		]
            }
	],
	"roles" : [

	]
    },
    {
	"Role" : "readWriteMember",
	"privileges" : [
            {
		"resource" : {
                    "db" : wingName,
                    "collection" : "Member"
		},
		"actions" : [
                    "collMod",
                    "find",
                    "update"
		]
            }
	],
	"roles" : [

	]
    },

];

// loop over the Roles and add them to the wingName DB, not the "admin" DB

Roles.forEach( role => db.createRole( role ));
