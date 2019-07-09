var baseGroupName = 'allseniors';
var googleGroup = baseGroupName + '@nhwg.cap.gov';
var collectionName = 'AllSeniorEmails';
var e = db.getCollection( collectionName ).find({});
while ( e.hasNext() ) {
    var m = e.next();
    var email = m.email.toLowerCase();
    var rx = new RegExp( email, 'i' );
    var g = db.getCollection("Groups").findOne( {Group: googleGroup, Members: rx });
    if ( g ) {
        continue;
    }
    else {
        print("gam update group", googleGroup, "add member", email );
    }
}
