const { config } = require("../MIMS/config/getConfig.js");

db.getCollection("DutyPosition").aggregate(

    // Pipeline
    [
        // Stage 1
        {
            $match: {
                Asst : NumberInt(0), 
                "$or" : [
                    {
                        Duty : "Commander"
                    }, 
                    {
                        Duty : /^Deputy Commander.*$/i
                    }, 
                    {
                        Duty : /^Personnel Off.*$/i
                    },
                    {
                          Duty : /^recruiting.*$/i
                    },
                ]
            }
        },

        // Stage 2
        {
            $lookup: {
                "from" : "Google",
                "localField" : "CAPID", 
                "foreignField" : "customSchemas.Member.CAPID", 
                "as" : "google"
            }
        },

        // Stage 3
        {
            $unwind: {
                "path" : "$google", 
                "preserveNullAndEmptyArrays" : false
            }
        },

        // Stage 4
        {
            $match: {
                "google.suspended": false,
            }
        },

        // Stage 5
        {
            $lookup: // Equality Match
            {
                from: "Squadrons",
                localField: "ORGID",
                foreignField: "ORGID",
                as: "unit"
            }
        },

        // Stage 6
        {
            $project: {
                "CAPID" : 1,
                "Name" : "$google.name.fullName", 
                "primaryEmail" : "$google.primaryEmail",    
                "Duty" : 1, 
                "Level" : "$Lvl", 
                "ORGID" : 1,
                "Unit" : "$unit.SquadIDStr",
                "Squadron" : "$unit.SquadName",
            }
        },

        // Stage 7
        {
            $unwind: {
                path : "$Unit",
                preserveNullAndEmptyArrays : false // optional
            }
        },

        // Stage 8
        {
            $unwind: {
                path : "$Squadron",
                preserveNullAndEmptyArrays : false // optional
            }
        },

        // Stage 9
        {
            $out: // Note: must be last stage of pipeline
            {
                 db: config.wing,
                 coll: "reportEmailList"
            }
        }
    ],

    // Options
    {
        collation: {
            locale: "en_US_POSIX",
            strength: 1,
            caseLevel: false
        }
    }
);
