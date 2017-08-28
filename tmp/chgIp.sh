#!/bin/bash

for i in {1..8}
do
#	yes | cp -rf /app/bmt-sdk1 /app/bmt-sdk${i}
	yes | cp -rf /app/bmt-sdk0/certificate.js /app/bmt-sdk${i}/certificate.js

	sed -i "s/localhost:61001/localhost:6100$((i+1))/" /app/bmt-sdk${i}/certificate.js
#	sed -i "s/localhost:62002/localhost:620$((i+1))/" /app/bmt-sdk${i}/point.js
done

for i in {9..59}
do
#       yes | cp -rf /app/bmt-sdk1 /app/bmt-sdk${i}
        yes | cp -rf /app/bmt-sdk0/certificate.js /app/bmt-sdk${i}/certificate.js

        sed -i "s/localhost:61001/localhost:610$((i+1))/" /app/bmt-sdk${i}/certificate.js
#       sed -i "s/localhost:62002/localhost:620$((i+1))/" /app/bmt-sdk${i}/point.js
done
