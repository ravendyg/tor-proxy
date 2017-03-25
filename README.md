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

Provide AUTH_TOKEN in config.json

&nbsp;

### Start
```
npm start
```


### Docker

Build
```
docker build -t tor-proxy .
```

Run
```
docker run -d --name tor-proxy -p 3014:3014 tor-proxy

or

./docker-run.sh
```

### Nginx
To setup redirect when container is down, but not the server. Nginx would return 502 and cheap DNS load balancing would fail.

Add redirect to another IP (at the end of server {}):
```
error_page 502 @handle_502;
location @handle_502 {
  proxy_pass          http://<another server ip>;
  proxy_set_header Host $host;
}
```

If you keep it going form server to server (without falling into a circle!!!), there is a chance of finding a working instance. Just remember not to add redirect to the last one.