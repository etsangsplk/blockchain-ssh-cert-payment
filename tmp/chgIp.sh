#!/bin/bash

for i in {40..59}
do
	#yes | cp -rf /app/bmt-sdk1 /app/bmt-sdk${i}

	sed -i "s/localhost:61040/localhost:610$((i+1))/" /app/bmt-sdk${i}/certificate.js
	sed -i "s/localhost:62040/localhost:620$((i+1))/" /app/bmt-sdk${i}/point.js
done
