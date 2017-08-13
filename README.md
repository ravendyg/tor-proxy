![BuildStatus](https://circleci.com/gh/ravendyg/tor-proxy.png?style=shield)

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

Provide API_KEY in config.json

&nbsp;

## Start
```
npm start
```

## TODO
- Use an object for maintaining workers list
- Keep track of response times inside of a worker and kill those that would display sluggish behaviour (maybe).
- Create functional tests using `https://2ip.ru` (later)
