# Fix Google JSON dates and external ID' for import into MongoDB
s/"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.000Z"/ISODate(&)/g
s/("value": )(")([0-9]+)(")/\1\3/
