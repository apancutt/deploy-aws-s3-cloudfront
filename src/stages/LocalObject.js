const fastGlob = require('fast-glob');
const fs = require('fs');
const md5File = require('md5-file');
const mimeTypes = require('mime-types');
const prettyBytes = require('pretty-bytes');
const AbstractObject = require('./AbstractObject');

module.exports = class LocalObject extends AbstractObject {

  constructor(cwd, relative) {
    super(cwd, relative);
  }

  get checksum() {
    return md5File.sync(this.absolute);
  }

  set checksum(arg) {}

  get type() {
    return mimeTypes.lookup(this.absolute) || 'application/octet-stream';
  }

  set type(arg) {}

  get size() {
    return fs.statSync(this.absolute).size;
  }

  set size(arg) {}

  get sizeForHumans() {
    return prettyBytes(this.size);
  }

  set sizeForHumans(arg) {}

  static find(cwd, exclude = []) {
    return fastGlob('**', {
      cwd,
      dot: true,
      ignore: exclude,
    })
      .then((objects) => objects.map((match) => new this(cwd, match)))
  }

}
