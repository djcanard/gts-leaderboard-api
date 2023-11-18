#!/bin/bash

#sudo systemctl stop gts-leaderboard-api
cd /mnt/usbdrv/build/gts-leaderboard-api || exit
git reset --hard
git pull
npm update
sudo systemctl stop gts-leaderboard-api
sudo systemctl start gts-leaderboard-api
curl --retry 5 --retry-connrefused http://localhost:3000
sudo systemctl stop gts-leaderboard-fetch
sudo systemctl start gts-leaderboard-fetch
