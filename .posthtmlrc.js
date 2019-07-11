const elo = require('./elo.json');

module.exports = {
  "plugins": {
    "posthtml-modules": {
      "root": "./web"
    },
    "posthtml-expressions": {
      "root": "./web",
      "locals": { elo }
    }
  }
};