// Seed MongoDB with new wing database and starting collecions
use MyWING;
var collections = [ 'Achievements',
		    'Commanders',
		    'DutyPosition',
		    'Google',
		    'GoogleGroups',
		    'MbrAchievements',
		    'MbrAddresses',
		    'MbrContact',
		    'Member',
		  ];

for ( var i = 0; i < collections.length; i++ ) {
    db.createCollection( collections[i], { collation: { 'locale': 'en_US', 'caseLevel': false, strength: 1 }});
}


