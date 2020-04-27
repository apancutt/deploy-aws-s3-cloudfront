module.exports = class AbstractObject {

  constructor(cwd, relative, checksum) {
    this.cwd = cwd;
    this.relative = relative;
    this.checksum = checksum;
  }

  get absolute() {
    return this.cwd + this.relative;
  }

  set absolute(arg) {}

}
