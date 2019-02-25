//NotMembers-filelist - interate over the Google account collection
// output a batch job to check if non-members have files
// 
// History:
// 18May17 MEG Created.
//
db = db.getSiblingDB("NHWG");
var cur = db.Google.find( {externalIds:{$elemMatch:{value:{$ne:null}}}} );
var m; //member
var g; //Google account
// Print preamble for bash script
print( "#!/bin/bash" );
print( "shopt -s expand_aliases" );
print( "source ~/.bashrc" );
print( ">fileslist.txt" );
while( cur.hasNext() ) {
   g = cur.next();
   m = db.Member.findOne( {CAPID:g.externalIds[0].value} );
   if ( m == null ) {
	print( "gamx user " + g.primaryEmail + " show filelist>>fileslist.txt");
   }
//   db.GG.insert({CAPID:NumberInt(g.externalIds[0].value)});
}
