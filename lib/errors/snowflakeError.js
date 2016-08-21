function SnowflakeError(message) {
        this.name = this.constructor.name;
        this.message = message;
        this.stack = (new Error()).stack;
}

SnowflakeError.prototype = new Error;

module.exports = SnowflakeError;