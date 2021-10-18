# Fix Google JSON dates to be ISODate format for Monogo import
s/"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z"/{"$date":&}/g
# strip quotes from externalId value field so Mongo will import as int
s/("value": )(")([0-9]+)(")/\1\3/
# strip quotes from custom schema Member.CAPID so Mongo will import as int
s/("CAPID": )(")([0-9]+)(")/\1\3/
