#!/bin/bash
if [ ! -d ~/.hfc-key-store/ ]; then
	mkdir ~/.hfc-key-store/
fi
cp $PWD/creds/* ~/.hfc-key-store/

for i in {1..39}
do
	yes | cp -rf $PWD/creds/* /app/bmt-sdk${i}/creds	
done
