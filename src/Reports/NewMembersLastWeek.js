// Copyright 2025 Marshall E. Giguere
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       https://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.


// Find new members that have joined in the last week,
// produce a csv file, with header.

// History:
// 12May24 MEG Catch missing email contact error.
// 29Aug23 MEG "getSiblingDB" call removed, DB passed on command line.
// 02Oct18 MEG Created.

var dfns = db.ENV.findOne({name:'DATEFNS'}).value;
load( dfns );

var today = new Date();
// look back period
var sdate = dateFns.subWeeks( today, 1 );
print("CAPID,NameLast,NameFirst,Type,Unit,EMAIL");
// Member email address

// Run query to find new members
var cur = db.Member.find({$or: [ {Joined:{ $gte: sdate }}, { OrgJoined: {$gte: sdate }}]}).sort({Unit:1, NameLast:1});

while ( cur.hasNext() ) {
    var mbr = cur.next();
    print( "CAPID:", mbr.CAPID );
    var ct = db.MbrContact.findOne( {CAPID:mbr.CAPID,Type:'EMAIL',Priority:'PRIMARY'})

    var ln = (mbr.NameSuffix == undefined? "" : mbr.NameLast + " " + mbr.NameSuffix);
    print(mbr.CAPID + ',' + ln + ',' + mbr.NameFirst +
    	  ',' + mbr.Type + ',' + '"' + mbr.Unit + '"' + ',' + ( ct? ct.Contact : '***UNKNOWN***' ));
}
