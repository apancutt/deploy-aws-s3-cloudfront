const base = require('../../src/options').config({ bucket: 'test' });

module.exports = {
  'default': () => base.config({
    destination: 'test',
    distribution: 'test',
    source: `${__dirname}/local-filesystem`,
  }),
  'install-soft-delete': () => base,
};
