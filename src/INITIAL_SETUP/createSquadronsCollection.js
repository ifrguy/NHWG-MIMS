// The base squadron information comes from the CAPWATCH Organization
// table. We could dynamically build it, but have just hard-coded it
// for MAWG here.
//
// We then dynamically add the location of each squadron.
let squadrons = [
  { ORGID: 660, Unit: '019', SquadIDStr: '019', Lvl: 'UNIT', SquadName: 'BEVERLY COMPOSITE SQDN' },
  { ORGID: 1108, Unit: '043', SquadIDStr: '043', Lvl: 'UNIT', SquadName: 'HANSCOM COMPOSITE SQDN' },
  { ORGID: 1110, Unit: '015', SquadIDStr: '015', Lvl: 'UNIT', SquadName: 'WESTOVER COMPOSITE SQDN' },
  { ORGID: 1618, Unit: '022', SquadIDStr: '022', Lvl: 'UNIT', SquadName: 'WORCESTER CADET SQUADRON' },
  { ORGID: 1620, Unit: '007', SquadIDStr: '007', Lvl: 'UNIT', SquadName: 'GODDARD CADET SQDN' },
  { ORGID: 2041, Unit: '002', SquadIDStr: '002', Lvl: 'UNIT', SquadName: 'BOSTON CADET SQUADRON' },
  { ORGID: 607, Unit: '071', SquadIDStr: '071', Lvl: 'UNIT', SquadName: 'PILGRIM COMPOSITE SQDN' },
  {
    ORGID: 1280,
    Unit: '013', SquadIDStr: '013',
    Lvl: 'UNIT', SquadName: 'BRIGADIER GENERAL ARTHUR J. PIERCE SQUADRON'
  },
  {
    ORGID: 1023,
    Unit: '044', SquadIDStr: '044', 
    Lvl: 'UNIT', SquadName: 'CAPE COD COASTAL PATROL 18 COMP SQDN'
  },
  { ORGID: 1475, Unit: '001', SquadIDStr: '001', Lvl: 'UNIT', SquadName: 'MASSACHUSETTS WING HQ' },
  {
    ORGID: 2580,
    Unit: '005', SquadIDStr: '005',
    Lvl: 'UNIT', SquadName: 'BRIDGEWATER STATE UNIVERSITY COMPOSITE SQUADRON'
  },
  { ORGID: 326, Unit: '070', SquadIDStr: '070', Lvl: 'UNIT', SquadName: 'ESSEX COUNTY COMPOSITE SQDN' }
].map(
  (squadron) =>
  {
    let coords = db.OrgAddresses.findOne(
      { ORGID: squadron.ORGID, Type:"MEETING" },
      { Latitude : 1, Longitude : 1, _id : 0});
    console.log(`${squadron.ORGID}: ${coords}`);
    squadron.Location =
      {
        type : "Point",
        coordinates : [ +coords.Longitude, +coords.Latitude ]
      };
    return squadron;
  });
db.Squadrons.deleteMany({});
db.Squadrons.insertMany(squadrons);
db.Squadrons.createIndex( { Location : "2dsphere" } );
