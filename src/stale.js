module.exports = (uploaded, deleted, options) => Promise.resolve(
  options.distribution
    ? (
      options['invalidation-paths']
        ? options['invalidation-paths']
        : Object.entries(uploaded).concat(options['soft-delete'] ? [] : Object.entries(deleted)).map(([ , params ]) => params.destination)
    )
    : []
);
