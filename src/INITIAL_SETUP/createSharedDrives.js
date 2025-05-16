// Create team drive
// teamDriveId=$(gam create teamdrive "wing-it: Attic" hide true ou "/" drivemembersonly errorretries 10 updateinitialdelay 20 updateretrydelay 5 returnidonly)
//  -- displays driveID used below. There is an additional option where it simply prints the driveID instead of a bunch of other information
//
// Add "Deleted Users" folder to that team drive
// gam user dlipman create drivefile drivefilename "joe.blow" mimetype gfolder teamdriveparentid ${teamDriveId} teamdriveparentname "Deleted Users"
//
// Transfer all of user@mawg.cap.gov's drive files to the prior-member archive
// gam user user@mawg.cap.gov transfer drive prior-member-archive@mawg.cap.gov retainrole none nonowner_targetrole fileorganizer
//
// Get shares in user prior-member-archive
// gam config auto_batch_min 1 num_threads 10 redirect csv /tmp/prior-member-archive-shares.csv multiprocess redirect stderr - multiprocess user prior-member-archive print filelist fields id,name,mimetype,basicpermissions pm type anyone em pmfilter oneitemperrow
//
// Delete those shares
// gam config num_threads 10 redirect stdout /tmp/DeleteAnyoneShares.txt multiprocess redirect stderr stdout csv /tmp/prior-member-archive-shares.csv gam user "~Owner" delete drivefileacl "~id" "id:~~permission.id~~"
