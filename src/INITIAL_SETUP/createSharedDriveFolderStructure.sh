#!/bin/bash -e
## Copyright 2025 Marshall E. Giguere
##
##   Licensed under the Apache License, Version 2.0 (the "License");
##   you may not use this file except in compliance with the License.
##   You may obtain a copy of the License at
##
##       https://www.apache.org/licenses/LICENSE-2.0
##
##   Unless required by applicable law or agreed to in writing, software
##   distributed under the License is distributed on an "AS IS" BASIS,
##   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
##   See the License for the specific language governing permissions and
##   limitations under the License.


# Create the standard directory hierarchy for a squadron shared drive or drives
# Writes to STDOUT.
# Shared drive must exist prior to running this script.
# DRIVE_ORAGIZER must be set to the email of a user with organizer
# privileges on each shared drive.  I usually just add myself as an organizer
# to all Workspace shared drives, or our IT role user.

# History:
# 27Jun24 MEG Skip non-existent drive.
# 23Jun24 MEG Created.

OPTS="o:h?"

# Authorized drive manager, must be organizer on all drives in ${DRIVES}
DRIVE_ORGANIZER="dlipman@mawg.cap.gov"

USAGE="$basename $0 [$OPTS] shared_drive [shared_drive]...>outputfile\n
\t Create the standard squadron folder hierarchy, drive must exist\n
\t share_drive - the name of the drive\n
\t o - drive organizer email ($DRIVE_ORGANIZER)\n
\t h|? this help message\n"

if [ $# -lt 1 ]; then
    echo -e $USAGE
    exit 1
fi

# Process options
while getopts $OPTS o; do
    case $o in
    o) DRIVER_ORGANIZER=$OPTARG;;
    h|?) echo -e $USAGE;exit 1;;
    *) echo -e $USAGE;exit 1;;
    esac
done
shift $(( $OPTIND - 1 ))

# Squadron shared drive(s) to create folder hierarchies on from command line.
DRIVES=( $@ )

# Full folder hierarchy
# All top level folders must come at the beginning of the create process
# due to temporal issues on Google with the time between create is called
# and when the Google storage manager acutally creates the requested director.
# The create API returns an ID, but it may still be sitting in the storage
# managers queue waiting to actually be instantiated.

# Test folder set
#DRIVE_FOLDERS=( '/A1 - Aerospace Education' '/B1 - Cadet Programs' '/D1 - Professional Development' '/D3 - Finance' '/D4 - Administration' '/D5 - Personnel' '/D6 - Public Affairs' '/D7 - Supply' '/D8 - Transportation' '/E1 - Commander' '/E2 - Safety' )

DRIVE_FOLDERS=( 
'/RESTRICTED'
'/MEMBERS'
'/CADETS'

'/RESTRICTED/A1 - Aerospace Education'
'/RESTRICTED/B1 - Cadet Programs'
'/RESTRICTED/D1 - Education & Training'
'/RESTRICTED/D3 - Finance'
'/RESTRICTED/D4 - Administration'
'/RESTRICTED/D5 - Personnel'
'/RESTRICTED/D6 - Public Affairs'
'/RESTRICTED/D7 - Supply'
'/RESTRICTED/D8 - Transportation'
'/RESTRICTED/E1 - Commander'
'/RESTRICTED/E2 - Safety'
'/RESTRICTED/Emergency Services'
'/RESTRICTED/Flight Operations'

'/RESTRICTED/A1 - Aerospace Education/AE POAs'
'/RESTRICTED/A1 - Aerospace Education/Internal Tasks'
'/RESTRICTED/A1 - Aerospace Education/External Tasks'

'/RESTRICTED/A1 - Aerospace Education/Internal Tasks/AEX'
'/RESTRICTED/A1 - Aerospace Education/Internal Tasks/AE Awards submitted'
'/RESTRICTED/A1 - Aerospace Education/Internal Tasks/Award Nominations'
'/RESTRICTED/A1 - Aerospace Education/Internal Tasks/Rocketry'
'/RESTRICTED/A1 - Aerospace Education/Internal Tasks/STEM kits'

'/RESTRICTED/A1 - Aerospace Education/External Tasks/AEMs assisted'
'/RESTRICTED/A1 - Aerospace Education/External Tasks/AEMs recruited'
'/RESTRICTED/A1 - Aerospace Education/External Tasks/External presentations'

'/RESTRICTED/B1 - Cadet Programs/Cadet Great Start'
'/RESTRICTED/B1 - Cadet Programs/Evaluations'
'/RESTRICTED/B1 - Cadet Programs/Goals Tracking'
'/RESTRICTED/B1 - Cadet Programs/Org Chart'
'/RESTRICTED/B1 - Cadet Programs/Other'
'/RESTRICTED/B1 - Cadet Programs/Schedules'
'/RESTRICTED/B1 - Cadet Programs/Squadron Activities'

'/RESTRICTED/D1 - Education & Training/Seniors Training'

'/RESTRICTED/D3 - Finance Committee Meetings'
'/RESTRICTED/D3 - Finance Committee Meetings/Agendas'
'/RESTRICTED/D3 - Finance Committee Meetings/Minutes'

'/RESTRICTED/D4 - Administration/File Plan'
'/RESTRICTED/D4 - Administration/Schedules and Hand Books'
'/RESTRICTED/D4 - Administration/Squadron Org Charts'

'/RESTRICTED/D5 - Personnel/Active Members'
'/RESTRICTED/D5 - Personnel/Active Members/Cadets'
'/RESTRICTED/D5 - Personnel/Active Members/Patrons'
'/RESTRICTED/D5 - Personnel/Active Members/Seniors'
'/RESTRICTED/D5 - Personnel/Awards except AE'
'/RESTRICTED/D5 - Personnel/Charters'
'/RESTRICTED/D5 - Personnel/Inactive Members'
'/RESTRICTED/D5 - Personnel/Misc'
'/RESTRICTED/D5 - Personnel/Org Chart'
'/RESTRICTED/D5 - Personnel/Promotions & Demotions'
'/RESTRICTED/D5 - Personnel/Uniforms'

'/RESTRICTED/D6 - Public Affairs/Newsletters'

'/RESTRICTED/D7 - Supply/Property Tag Photos'

'/RESTRICTED/D8 - Transportation/Completed CAPF 73s'

'/RESTRICTED/E1 - Commander/Backup Email Squadron Commander'
'/RESTRICTED/E1 - Commander/Member suspension paperwork (if applicable)'
'/RESTRICTED/E1 - Commander/Proof of Non-Discrimination annual briefing (roster or sign in sheet or copy of e-mail sent to membership)'
'/RESTRICTED/E1 - Commander/Rosters for all cadet activities for the past year'
'/RESTRICTED/E1 - Commander/Signed fundraising approval forms'
'/RESTRICTED/E1 - Commander/SUI Reports'
)

#echo ${DRIVES[@]}
#echo ${#DRIVES[@]}
#echo ${#DRIVE_FOLDERS[@]}

for d in ${DRIVES[@]}; do
    echo "Drive: $d"
    if gam info teamdrive teamdrive:$d asadmin &>/dev/null; then
        echo "$d already exists, skipping."
        echo "---"
        continue
    fi

    # Create the shared drive
    teamDriveId=$(gam user ${DRIVE_ORGANIZER} create teamdrive ${d} asadmin errorretries 10 updateinitialdelay 20 updateretrydelay 5 returnidonly)
    gam user ${DRIVE_ORGANIZER} add drivefileacl "$teamDriveId" group wing-it role manager
    gam user ${DRIVE_ORGANIZER} delete drivefileacl "$teamDriveId" ${DRIVE_ORGANIZER}

    l=${#DRIVE_FOLDERS[@]}
    i=0
    while (( $i < $l )); do
        echo "creating folder SharedDrives/$d${DRIVE_FOLDERS[$i]}"
        gam user ${DRIVE_ORGANIZER} create drivefolderpath fullpath "SharedDrives/$d${DRIVE_FOLDERS[$i]}"
        sleep 3
        i=$(( $i + 1 ))
    done
    echo "---"
done
