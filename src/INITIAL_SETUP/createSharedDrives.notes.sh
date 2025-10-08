# Create team drive for attic
teamDriveId=$(gam create teamdrive "wing-it: Attic" hide true ou "/" drivemembersonly errorretries 10 updateinitialdelay 20 updateretrydelay 5 returnidonly)
#  -- displays driveID used below. There is an additional option where
#  -- it simply prints the driveID instead of a bunch of other
#  -- information

# Add "Deleted Users" folder to that team drive
gam user dlipman create drivefile drivefilename "joe.blow" mimetype gfolder teamdriveparentid ${teamDriveId} teamdriveparentname "Deleted Users"

# Transfer all of user@mawg.cap.gov's drive files to the prior-member archive
gam user user@mawg.cap.gov transfer drive prior-member-archive@mawg.cap.gov retainrole none nonowner_targetrole fileorganizer
#
# Get shares in user prior-member-archive
gam config auto_batch_min 1 num_threads 10 redirect csv /tmp/prior-member-archive-shares.csv multiprocess redirect stderr - multiprocess user prior-member-archive print filelist fields id,name,mimetype,basicpermissions pm type anyone em pmfilter oneitemperrow
#
# Delete those shares
gam config num_threads 10 redirect stdout /tmp/DeleteAnyoneShares.txt multiprocess redirect stderr stdout csv /tmp/prior-member-archive-shares.csv gam user "~Owner" delete drivefileacl "~id" "id:~~permission.id~~"


#
# Squadron Drive
#
teamDriveId=$(gam user dlipman create teamdrive derrell-test ou "001 - Massachusetts Wing" asadmin errorretries 10 updateinitialdelay 20 updateretrydelay 5 returnidonly)
gam user dlipman add drivefileacl "$teamDriveId" group wing-it role manager
gam user dlipman delete drivefileacl "$teamDriveId" dlipman

# Enable limited access on a folder by clearing all prior ACLs
gam update drivefileacl ${folderId} clear

# Delete an entire shared drive
teamDriveId=$(gam print teamdrives | grep ${DRIVE_NAME_TO_DELETE} | awk 'BEGIN { FS = "," } ; { print $2; }') ; gam user dlipman delete teamdrive ${teamDriveId} allowitemdeletion

# Create a "limited access" folder (inhteritedPermissionsDisabled set # to true)
gam user dlipman create drivefile drivefilename test teamdriveparentid 0ANmOWQ1BcO_HUk9PVA mimetype gfolder inheritedPermissionsDisabled true
