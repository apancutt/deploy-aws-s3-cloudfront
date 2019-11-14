module.exports = (resolution) => ({
  promise: () => Promise.resolve(resolution),
});
