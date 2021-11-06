// Scan the newbie group and remove members who have been on the list 
// longer that the retention time.

var db = db.getSiblingDB("NHWG");

function daysInMicroSeconds( d ) {
    let day = 1000*60*60*24; //one day in milliseconds
    return day * d;
}

// email address of the newbie group
const newbieGroup = 'newbie@nhwg.cap.gov';

var count = 0; // number of members removed from newbie group
var today = new Date().getTime();  //date today in microseconds
var retention = 90;  //how many days members may stay in the newbie list

// members on the list earlier that this date will be removed
var lookback = today - daysInMicroSeconds( retention );

// Find all members who have been in the newbe group more that the retention number of days
var cursor = db.getCollection("GoogleGroups").find({ group: newbieGroup, role: 'MEMBER', createTime: { $lte: lookback}});
print( "#Checking", newbieGroup, "for members to remove" );
while ( cursor.hasNext() ) {
    let m = cursor.next();
    print( "gam update group", newbieGroup, "delete member", m.email );
    count++;
}
print( "#Complete:", count, "members to be removed." );

    