Multiple tor instances manager.

&nbsp;

## Dependecies
node 6.10.2, tor

&nbsp;

## Installation
```
npm i
```

&nbsp;

## Setup
Requires two ports for each tor instance.

To override default config create ./lib/config.json file and put new values there.

Provide AUTH_TOKEN in config.json

&nbsp;

## Start
```
npm start
```


## Docker

Build
```
docker build -t tor-proxy .
```

Run
```
docker run -d --name tor-proxy -p 3014:3014 <docker account>/or-proxy

or

./docker-run.sh
```

## Balancer
Each server randomly distribute requests between itself and other servers it aware of.


## Commands
It's possible to perform some remote set up

POST url/command
body: {
  action: string,
  payload: any
}

#### Count workers
action === 'count workers'
return number of workers running
{
  count: number
}

#### Add worker
action === 'add worker'
add a worker and return their number
{
  count: number
}

#### Remove worker
action === 'remove worker'
remove a worker and return their number
if there is no more workers server would shut down since master can't accept requests
{
  count: number
}

#### Get mirrors
action === 'get mirrors'
return list of known mirrors (including the server itself as "meself")
{
  mirrors: string []
}

#### Add mirror
action === 'add mirror'
patload: string // mirror url
return 204

#### Remove mirror
action === 'remove mirror'
patload: string // mirror url
return 204  // server itself ("meself") can't be removed