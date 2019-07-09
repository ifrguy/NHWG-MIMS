// compare the target Google group to the active member emails, remove email addresses
// that are not found in the MbrContacts collection.

 
//Declarations:
var db = db.getSiblingDB('NHWG');
// import date math functions
load( db.ENV.findOne( {name:'DATEFNS'} ).value );
// look past 30 days expired
var lookbackdate = dateFns.subDays( new Date(), 30 );
// Google group address
var groupAddress = 'allcadets@nhwg.cap.gov';
// Membership type of interest
var mbrType = 'cadet';

// Aggregate a list of all emails for the Google group of interest
// returns a cursor
var m = db.getCollection("Groups").aggregate(
    [
        { 
            "$match" : {
                "Group" : groupAddress
            }
        }, 
        { 
            "$unwind" : {
                "path" : "$Members", 
                "preserveNullAndEmptyArrays" : false
            }
        }, 
        { 
            "$project" : {
                "Email" : "$Members"
            }
        }
    ], 
    { 
        "allowDiskUse" : false
    }
);

while ( m.hasNext() ) {
   	var e = m.next().Email;
   	var rgx = new RegExp( e, "i" );
   	var r = db.getCollection( 'MbrContact' ).find( { Type: 'EMAIL', Priority: 'PRIMARY', Contact: rgx } );
	while ( r.hasNext() ) {
	    var t = r.next();
	    var a = db.getCollection( 'Member' ).findOne( { CAPID: t.CAPID, Type: mbrType } );
	    if ( a == null || a.MbrStatus == 'ACTIVE' ) { continue; }
   		
   		if ( a.Expiration < lookbackdate ) {
   		    print( '#INFO:', t.CAPID, a.NameLast, a.NameFirst, a.NameSuffix, 'Expiration:', a.Expiration );
   	    	print( 'gam update group', groupAddress, 'delete member', e );
   		}
	}
}
