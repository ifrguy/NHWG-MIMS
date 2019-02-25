if (!load("/home/meg/work/NHWG/Queries/stringFormatting.js")) {
  print("ERROR: could not load string format functions.");
  quit();
}

var db = db.getSiblingDB( 'NHWG' );
var t1 ="{0},{1},{2}";
var rx = new RegExp( '^brown', 'i' );
var cursor = db.Member.find({NameLast: {$regex: rx }}).sort({CAPID:1});
print("CAPID,Last Name,First Name,Suffix");
while ( cursor.hasNext() ) {
  var rec = cursor.next();
//  print( rec.CAPID + "\t" + rec.NameLast + "\t\t" + rec.NameFirst + "\t" + rec.NameSuffix);
	print( t1.format( rec.CAPID, rec.NameLast, rec.NameFirst, rec.NameSuffix ));
}

