// Seed MongoDB with new wing database and starting collecions
use NHWG;
var collections = [ 'Achievements',
		    'Commanders',
		    'DutyPosition',
		    'Google',
		    'Groups',
		    'MbrAchievements',
		    'MbrAddresses',
		    'MbrContact',
		    'Member',
		    'Organization',
		  ];

for ( var i = 0; i < collections.length; i++ ) {
    db.createCollection( collections[i], { collation: { 'locale': 'en_US_POSIX', 'caseLevel': false, strength: 1 }});
}


