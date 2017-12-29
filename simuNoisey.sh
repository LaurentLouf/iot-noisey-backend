#!/bin/sh

while true ;
do
	# First Noisey
	COUNT=$(shuf -i 0-10 -n 1)
	if [ $COUNT -gt 7 ]
	then
		LEVEL=$(shuf -i 15-150 -n 1)
	else 
		LEVEL=$(shuf -i 15-30 -n 1)
	fi
	VAR=$(shuf -i 1-15 -n 1)
	LEVELMIN=$(expr $LEVEL - $VAR)
	LEVELMAX=$(expr $LEVEL + $VAR)
	LEVELS=""
	for i in 1 2 3 4 
	do
		CURLEVEL=$(shuf -i $LEVELMIN-$LEVELMAX -n 1)
		LEVELS=$LEVELS$CURLEVEL","
	done
	CURLEVEL=$(shuf -i $LEVELMIN-$LEVELMAX -n 1)
	LEVELS=$LEVELS$CURLEVEL
	echo '{"id":12865312, "nbElements": 5, "first": true, "last": true, "interval":1920, "noise":['$LEVELS']}'

	curl -X POST --data '{"id":12865312, "nbElements": 5, "first": true, "last": true, "interval":1920, "noise":['$LEVELS']}' --header "Content-Type: application/json" https://localhost:8443/api/data --cacert certificate.crt
	echo ""

	# Second Noisey
	COUNT=$(shuf -i 0-10 -n 1)
	if [ $COUNT -gt 7 ]
	then
		LEVEL=$(shuf -i 15-150 -n 1)
	else 
		LEVEL=$(shuf -i 15-30 -n 1)
	fi
	VAR=$(shuf -i 1-15 -n 1)
	LEVELMIN=$(expr $LEVEL - $VAR)
	LEVELMAX=$(expr $LEVEL + $VAR)
	LEVELS=""
	for i in 1 2 3 4
	do
		CURLEVEL=$(shuf -i $LEVELMIN-$LEVELMAX -n 1)
		LEVELS=$LEVELS$CURLEVEL","
	done
	CURLEVEL=$(shuf -i $LEVELMIN-$LEVELMAX -n 1)
	LEVELS=$LEVELS$CURLEVEL
	echo '{"id":12865312, "nbElements": 5, "first": true, "last": true, "interval":1920, "noise":['$LEVELS']}'

	curl -X POST --data '{"id":512457896314, "nbElements": 5, "first": true, "last": true, "interval":1920, "noise":['$LEVELS']}' --header "Content-Type: application/json" https://localhost:8443/api/data --cacert certificate.crt
	echo ""

	# Sleep
	sleep 10
done