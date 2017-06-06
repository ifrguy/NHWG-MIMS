# NHWG-MIMS
New Hampshire Wing Member Info Management System

Author: Capt Marshall Giguere

MIMS is intended to synchronize member accounts between National database and Wing accounts.  Provides the following functions: Add new members, remove members no longer found on National rolls, Suspend expired member accounts until they either fall off the rolls, or renew. MIMS scans the National database and emits batch jobs to perform it's various tasks.  MIMS is intended to be platform agnostic although it is designed primarily with Linux in mind.

Requirements:

O/S: Linux, Windows 7 or above

Python 3

GAMADV-X (a excellent tool developed by Ross Scroggs)

MongoDB - document database
