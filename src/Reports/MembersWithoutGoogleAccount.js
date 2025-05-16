let members =
    db.Member.aggregate(
      [
        {
          $lookup :
          {
            from : "Google",
            localField : "CAPID",
            foreignField : "customSchemas.Member.CAPID",
            as : "google"
          }
        }
      ])
    .toArray()
    .filter((entry) => entry.google.length == 0)
    .sort((a,b) => a.Unit > b.Unit ? 1 : a.Unit < b.Unit ? -1 : (a.Type > b.Type ? -1 : a.Type < b.Type ? 1 : 0))
    .map((entry) =>
      {
        return (
          {
            Unit : entry.Unit,
            Type : entry.Type,
            Name : (entry.NameLast + ", " + entry.NameFirst + " " + (entry.NameMiddle || "") + " " + (entry.NameSuffix || "")).trim(),
            MbrStatus : entry.MbrStatus
          }
        );
      });



print('Unit,Type,Name,Status');
members.forEach(
  (entry) =>
  {
    if (entry.Type == "AEM" || entry.MbrStatus == "EXMEMBER")
    {
      return;
    }
    print(`"/${entry.Unit}", "${entry.Type}", "${entry.Name}", "${entry.MbrStatus}"`);
  });
