const { teams } = require('./web/js/elo.json');

module.exports = {
  "plugins": {
    "posthtml-modules": {
      "root": "./web"
    },
    "posthtml-expressions": {
      "root": "./web",
      "locals": { teams }
    }
  }
};