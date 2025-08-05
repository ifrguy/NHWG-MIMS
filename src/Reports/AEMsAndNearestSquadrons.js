// Query the Open Street Maps API to find latitude/longitude of a
// given address
async function findLatLon(address)
{
  const addrToLatLonUrl = "https://nominatim.openstreetmap.org/search";
  let query;

  // Which address type do we have? A string is a freeform query; an
  // object has the fields broken out.
  if (typeof address == "string")
  {
    query = `q=${encodeURIComponent(address)}`;
  }
  else
  {
    // address fields we care about are:
    // - Addr1 (optional)
    // - City
    // - State
    if (address.Addr1)
    {
      query =
        [
          `street=${encodeURIComponent(address.Addr1)}`,
          `city=${encodeURIComponent(address.City)}`,
          `state=${encodeURIComponent(address.State)}`
        ].join("&");
    }
    else
    {
      query =
        [
          `city=${encodeURIComponent(address.City)}`,
          `state=${encodeURIComponent(address.State)}`
        ].join("&");
    }
  }

  // Build the URL to query for address=>lat/lon conversion
  let url = `${addrToLatLonUrl}?${query}&format=geocodejson`;
  
  // Issue the query!
  return fetch(url)
    .then((response) => response.body)
    .then((rb) => {
      const reader = rb.getReader();

      return new ReadableStream(
        {
          start(controller)
          {
            // Handle each data chunk
            function push()
            {
              // "done" is a Boolean and value a "Uint8Array"
              reader.read()
                .then(
                  ({ done, value }) =>
                  {
                    // If there is no more data to read...
                    if (done)
                    {
                      // ... then we're done here
                      controller.close();
                      return;
                    }

                    // Get the data and send it to the browser via the controller
                    controller.enqueue(value);
                    push();
                  });
            }

            push();
          },
        });
    })
    .then((stream) =>
      // Respond with our stream
      new Response(stream, { headers: { "Content-Type": "text/html" } }).text(),
    );
}

// Build the report
async function doReport()
{
  // First, we'll find all AEMs and their addresses and contact info
  let aemPipeline =
      [
        { 
          "$match" : { 
            "Type" : "AEM", 
            "MbrStatus" : "ACTIVE"
          }
        }, 
        {
          "$lookup" : {
            "from" : "MbrAddresses",
            "localField" : "CAPID",
            "foreignField" : "CAPID",
            "as" : "address"
          }
        },
        {
          "$unwind" : {
            "path" : "$address",
            "preserveNullAndEmptyArrays" : false
          }
        },
        { 
          "$lookup" : { 
            "from" : "MbrContact", 
            "localField" : "CAPID", 
            "foreignField" : "CAPID", 
            "as" : "contacts"
          }
        }, 
        // { 
        //   "$unwind" : { 
        //     "path" : "$contacts", 
        //     "preserveNullAndEmptyArrays" : true
        //   }
        // }, 
        { 
          "$sort" : { 
            "NameLast" : 1
          }
        },
      ];

  // We'll cache lat/lon for each member, to avoid multiple API queries
  let capidToLatLonMap = {};

  // Retrieve the list of AEMs
  let aemList = db.Member.aggregate(aemPipeline).toArray();

  // Get the latitude and longitude for each AEM
  for (let aem of aemList)
  {
    // Do we already have the lat/lon for this member?
    if (capidToLatLonMap[aem.CAPID])
    {
      // Yup. No need to look it up.
      continue;
    }
    else if (aem.address.Latitude && aem.address.Longitude)
    {
      // The MbrAddresses record has latitude and longitude. Use it.
      capidToLatLonMap[aem.CAPID] = [ +aem.address.Longitude, +aem.address.Latitude ];
      continue;
    }

    // We need to use the API to determine latitude and longitude.
    let result = await findLatLon(aem.address);
    result = JSON.parse(result);

    // Did we successfully obtain coordinates?
    if (! Array.isArray(result.features) ||
        ! result.features[0]?.geometry?.coordinates)
    {
      // No. Try again with just city and state. The API can't find all street addresses
      result = await findLatLon(
        {
          City : aem.address.City,
          State : aem.address.State
        });
      result = JSON.parse(result);
    }

    // Cache the result
    if (Array.isArray(result?.features))
    {
      capidToLatLonMap[aem.CAPID] = result?.features[0]?.geometry?.coordinates;
    }
    else
    {
      capidToLatLonMap[aem.CAPID] = null;
    }
  }

  // Find the nearest few squadrons to each AEM's address
  aemList.forEach(
    (aem) =>
    {
      let nearestSquadronPipeline =
          [
            {
              $geoNear:
              {
                near: { type: "Point", coordinates: capidToLatLonMap[aem.CAPID] },
                distanceField: "calculatedDistance",
                spherical: true
              }
            },
            {
              $match:
              {
                Unit : { $ne : "001" }
              }
            },
            {
              $limit: 3
            },
            {
              $project:
              {
                _id : 0,
                SquadronName : "$SquadName",
                Distance :
                {
                  $multiply : [ "$calculatedDistance", 0.000621371192 ] } // meters -> miles
              }
            }
          ];

      // Find the nearest squadrons to this AEM's address
      aem.squadrons = db.Squadrons.aggregate(nearestSquadronPipeline).toArray();
    });

  // console.log(aemList);
  
  // Give 'em what they came for!
  print(
    [
      `"CAPID"`,
      `"Last Name"`,
      `"First Name"`,
      `"Middle Name"`,
      `"Name Suffix"`,
      `"Email Primary"`,
      `"Email Secondary"`,
      `"Phone Primary"`,
      `"Phone Secondary"`,
      `"Squadron 1 Name"`,
      `"Squadron 1 Distance (miles)"`,
      `"Squadron 2 Name"`,
      `"Squadron 2 Distance (miles)"`,
      `"Squadron 3 Name"`,
      `"Squadron 3 Distance (miles)"`,
      `"Join Date"`,
      `"Expiration Date"`
    ].join(","));
  aemList.forEach(
    (aem) =>
    {
      let contacts =
          {
            email :
            {
              primary : "",
              secondary : ""
            },

            phone :
            {
              primary : "",
              secondary : ""
            }
          };

      for (let contact of aem.contacts)
      {
        if (contact.Type.includes("EMAIL"))
        {
          if (contact.Priority == "PRIMARY")
          {
            contacts.email.primary = contact.Contact;
          }
          else if (contact.Priority == "SECONDARY")
          {
            contacts.email.secondary = contact.Contact;
          }
        }
        else if (contact.Type.includes("PHONE"))
        {
          if (contact.Priority == "PRIMARY")
          {
            contacts.phone.primary = contact.Contact;
          }
          else if (contact.Priority == "SECONDARY")
          {
            contacts.phone.secondary = contact.Contact;
          }
        }
      }

      // Convert an ISODate in the database to its YYYY-MM-DD string equivalent
      let convertDate =
          (isoDate) =>
          {
            let date = new Date(isoDate);

            return(
              [
                date.getFullYear(),
                ("0" + (date.getMonth() + 1)).substr(-2),
                ("0" + date.getDate()).substr(-2)
              ].join("-"));

          };

      print(
        [
          `"${aem.CAPID}"`,
          `"${aem.NameLast}"`,
          `"${aem.NameFirst}"`,
          `"${aem.NameMiddle}"`,
          `"${aem.NameSuffix}"`,
          `"${contacts.email.primary}"`,
          `"${contacts.email.secondary}"`,
          `"${contacts.phone.primary}"`,
          `"${contacts.phone.secondary}"`,
          `"${aem.squadrons[0].SquadronName}"`,
          `"${Math.round(aem.squadrons[0].Distance)}"`,
          `"${aem.squadrons[1].SquadronName}"`,
          `"${Math.round(aem.squadrons[1].Distance)}"`,
          `"${aem.squadrons[2].SquadronName}"`,
          `"${Math.round(aem.squadrons[2].Distance)}"`,
          `"${convertDate(aem.Joined)}"`,
          `"${convertDate(aem.Expiration)}"`
        ].join(","));
    });
}

// Do it!
doReport();
