#!/bin/bash
##
## This is a deployment script. To fetch it, Git must be installed and for its 
## execution, an Internet connection must be available.
## To enable SSH on a Raspberry Pi, it may be necessary to add a file named "ssh" 
## in the boot directory of the SD card. Continuing on this platform, the WiFi 
## have to be manually configured by editing the file 
## /etc/wpa_supplicant/wpa_supplicant.conf and adding the following structure
## at the end of the file : 
## network={
## 		ssid="ssid"
## 		psk="password"
## 	}
## 
## To avoid guessing the IP of the board when connecting through Ethernet, the following
## could be appended to /etc/dhcpd.conf 
## interface eth0
## static ip_address=142.241.142.241/24
## static routers=142.241.142.1
## static domain_name_servers=142.241.142.1

## Update the sources list, upgrade the pre-installed software and install most dependencies
sudo apt-get update 
sudo apt-get upgrade -y 
sudo apt-get install -y gedit curl lsb-release apt-transport-https build-essential nginx mongodb 

## Recent version of Node.js
curl --silent https://deb.nodesource.com/gpgkey/nodesource.gpg.key | sudo apt-key add -
VERSION=node_8.x
DISTRO="$(lsb_release -s -c)"
echo "deb https://deb.nodesource.com/$VERSION $DISTRO main" | sudo tee /etc/apt/sources.list.d/nodesource.list
echo "deb-src https://deb.nodesource.com/$VERSION $DISTRO main" | sudo tee -a /etc/apt/sources.list.d/nodesource.list
sudo apt-get update
sudo apt-get install -y nodejs 
## Installation of npm modules for the project
npm install 

## Initialization of the database
mongo admin  --eval "db.getSiblingDB('noisey').createUser({user: 'root', pwd: 'toor', roles: [{role: 'dbOwner', db: 'noisey'}]})"

## Create certificate and key
openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 -keyout privateKey.key -out certificate.crt
sudo mkdir /etc/nginx/ssl
sudo cp privateKey.key /etc/nginx/ssl/noiseyKey.key 
sudo cp certificate.crt /etc/nginx/ssl/noiseyCertificate.crt  
sudo cp nginx.conf /etc/nginx/sites-available/noisey 
sudo ln -s /etc/nginx/sites-available/noisey /etc/nginx/sites-enabled/noisey
sudo rm /etc/nginx/sites-enabled/default
sudo service nginx restart

## Installation of PM2
sudo npm install pm2 -g
pm2 start index.js

## Display SHA1 fingerprint of the certificate and interfaces to fetch their IP address
openssl x509 -noout -fingerprint -sha1 -inform pem -in certificate.crt
sudo ifconfig 
