# Gran Turismo Sport leaderboard API

## usage

### npm run start-fetch

Runs scheduled tasks to fetch data from the Gran Turismo website, convert it, and store it in the `/data/raw` folder.

### npm run start-api

Starts up REST endpoints to make the converted data files available for the gts-leaderboard Vue app .

## feature backlog

* update data with check on faster result
* do not include data older than a year
* fetch time trial records

## /data/store/users.json

The file `data/store/users.json` should be edited to contain the desired user id's.
