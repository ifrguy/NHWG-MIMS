// Scan AircrewMailingList and match email address to a CAP Wing Member
// Prints a list of members to add to the mailing mailing list.
// History:
// 07Dec24 DJL Consolidate configuration files for single point changes.
// 07Jul16 MEG Created.

const { config } = require("../MIMS/config/getConfig.js");
db = db.getSiblingDB(config.wing);

var i=null;
var p=null;
var q=null;
var r=null;
var tot=0;
var emaila="";
var emailg="";
var missing=[];

var cur=db.AircrewMailingList.find({});
while ( cur.hasNext() ) {
    p=cur.next();
    emaila=p["Email address"];
    // find contact with emaila in it.
    q=db.MemberContact.findOne( {Contact:emaila} );
    if ( q == null ) { 
	missing.push( emaila );
	continue;
    }
    // pull member record
    r=db.Member.findOne({CAPID:q.CAPID});
    if ( q == null ) { continue; }
    // finally we have the member from the aircrew list whose email we started with
    //now print a Google compatible email entry
    emailg = '"' + r.NameLast + " " + r.NameFirst;
    r.NameMiddle ? emailg = emailg + " " + r.NameMiddle[0] : 0;
    r.NameSuffix ? emailg = emailg + " " + r.NameSuffix : 0;
    emailg = emailg + " " + r.CAPID + '" <' + emaila + '>';
    print( emailg );
    tot++;
}
print( "Found Members: ", tot );
print( "Unknown Members: ", missing.length );
var m=0;
for ( m in missing ) {
	print( missing[ m ] );
}
