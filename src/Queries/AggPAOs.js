db.getCollection("DutyPosition").aggregate(

    // Pipeline
    [
        // Stage 1
        {
            $match: {
                // enter query here
            //    FunctArea: "PA",
                Duty: /Public Affairs/,
                Asst : 0,
            }
        },

        // Stage 2
        {
            $lookup: {
                from: "Member",
                localField: "CAPID",
                foreignField: "CAPID",
                as: "member"
            }
        },

        // Stage 3
        {
            $unwind: {
                path: "$member"
            }
        },

        // Stage 4
        {
            $match: {
                // enter query here
                "member.MbrStatus" : "ACTIVE",
            }
        },

        // Stage 5
        {
            $lookup: {
                from: "Google",
                localField: "CAPID",
                foreignField: "customSchemas.Member.CAPID",
                as: "google"
            }
        },

        // Stage 6
        {
            $unwind: {
                path: "$google",
            }
        },

        // Stage 7
        {
            $match: {
                "google.suspended" : false,
            }
        },

        // Stage 8
        {
            $project: {
                // specifications
                CAPID: 1,
                Duty : 1,
                Level : "$Lvl",
                "Rank" : "$member.Rank",
                "Name" : "$google.name.fullName",
                "email" : "$google.primaryEmail",
                "Unit" : "$member.Unit",
            }
        }
    ],

    // Options
    {

    }

    // Created with Studio 3T, the IDE for MongoDB - https://studio3t.com/

);