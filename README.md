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
- Move enter point to index, make console app with `--help` and other cool stuff.
- Add scheduled restart.
- Keep track of response times inside of a worker and kill those that would display sluggish behaviour (maybe).

