const promisable = require('./promisable');

class CloudFront {

  createInvalidation(params) {
    this.lastCreateInvalidationParams = params;
    return promisable();
  }

}

module.exports = CloudFront;
