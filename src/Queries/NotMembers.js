//NotMembers - interate over the Google account collection, check if user is found in Member collection.
// If user is not found they are a candidate for account removal, or suspend
// History:
// 05May17 MEG Created.
//
db = db.getSiblingDB("NHWG");
var cur = db.Google.find( {externalIds:{$elemMatch:{value:{$ne:null}}}} );
var m; //member
var g; //Google account
print( "email,CAPID,NameLast,NameFirst,Type,Unit,LastLogin" );
while( cur.hasNext() ) {
   g = cur.next();
   m = db.Member.findOne( {CAPID:g.externalIds[0].value} );
   if ( m == null ) {
	print( g.primaryEmail + "," + g.externalIds[0].value +"," + g.name_familyName + "," + g.name_givenName + ","
			+ g.organizations[0].description + "," + g.organizations[0].department + "," + g.lastLoginTime );
   }
//   db.GG.insert({CAPID:NumberInt(g.externalIds[0].value)});
}
