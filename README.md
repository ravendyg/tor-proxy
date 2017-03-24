Multiple tor instances manager.

&nbsp;

### Dependecies
node 6.5.0, tor

&nbsp;

### Installation
```
npm i
```

&nbsp;

### Setup
Requires two ports for each tor instance.

To override default config create ./lib/config.json file and put new values there.


&nbsp;

### Start
```
npm start
```


### Docker

Build
```
docker build --build-arg AUTH_TOKEN=<auth_token> -t tor-proxy .
```
<auth_token> - should be passed as "x-auth-token" header.

Run
```
docker run -d --name tor-proxy -p 3014:3014 tor-proxy

or

./docker-run.sh
```