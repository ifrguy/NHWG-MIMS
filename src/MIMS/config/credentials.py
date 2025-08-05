"""
MIMS MongoDB Credentials File
"""
## Copyright 2017 Marshall E. Giguere
##
##   Licensed under the Apache License, Version 2.0 (the "License");
##   you may not use this file except in compliance with the License.
##   You may obtain a copy of the License at
##
##       http://www.apache.org/licenses/LICENSE-2.0
##
##   Unless required by applicable law or agreed to in writing, software
##   distributed under the License is distributed on an "AS IS" BASIS,
##   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
##   See the License for the specific language governing permissions and
##   limitations under the License.



# Read the credentials file
import json
with open('./credentials.json') as f:
  CREDENTIALS = json.load(f)

# Mongo DB cred's
MIMSUSER = CREDENTIALS["mims"]["user"]
MIMSPASS = CREDENTIALS["mims"]["password"]
