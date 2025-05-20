// Seed MongoDB with new wing database and starting collecions
// Example: Wing name is "New Hampshire Wing" -> NHWG
use YOUR DB NAME HERE;
const collections = [ 'Achievements',
		      'Commanders',
		      'DutyPosition',
		      'Google',
		      'GoogleGroups',
		      'Holds',
		      'MbrAchievements',
		      'MbrAddresses',
		      'MbrContact',
		      'Member',
		      'equipment',
		    ];

// create each collection and set collation
collections.forEach( col => db.createCollection( col,  { collation: { 'locale': 'en_US', 'caseLevel': false, strength: 1 }}));



