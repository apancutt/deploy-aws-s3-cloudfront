module.exports = require('../../src/options').config({
  bucket: 'test',
  destination: 'test',
  distribution: 'test',
  source: `${__dirname}/local-filesystem`,
});
