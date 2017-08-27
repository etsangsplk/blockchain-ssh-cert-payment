#!/bin/bash

for i in {1..59}
do
	yes | cp -rf /app/bmt-sdk0/bmt/bmt.js /app/bmt-sdk${i}/bmt
done
