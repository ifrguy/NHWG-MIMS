// Scan the newbie group and remove members who have been on the list 
// longer that the retention time.
// Newbies are automatically added to the newbie group at account creation time.
//
// History:
// 18Mar22 MEG Fixed bug, lookback date not calculated correctly.
// 08Nov21 MEG Created.

var db = db.getSiblingDB("NHWG");
// load date arithmetic functions
load( db.ENV.findOne( { name: 'DATEFNS' } ).value );

// email address of the newbie group
const newbieGroup = 'newbie@nhwg.cap.gov';

var count = 0; // number of members removed from newbie group
var today = new Date();  //date today
var retention = 90;  //how many days members may stay in the newbie list

// members on the list earlier that this date will be removed
var lookback = dateFns.subDays( today, retention );

// Find all members who have been in the newbe group more that the retention number of days
var cursor = db.getCollection("GoogleGroups").find({ group: newbieGroup,
						     role: 'MEMBER',
						     createTime: { $lte: lookback }});
print( "#Checking", newbieGroup, "for members to remove" );
while ( cursor.hasNext() ) {
    let m = cursor.next();
    print( "gam update group", newbieGroup, "delete member", m.email );
    count++;
}
print( "#Complete:", count, "members to be removed." );
