function SnowflakeError (message, properties) {
  this.name = this.constructor.name;
  this.message = message;
  this.stack = (new Error()).stack;
  if (properties) this.properties = properties;
}

SnowflakeError.prototype = new Error;

module.exports = SnowflakeError;