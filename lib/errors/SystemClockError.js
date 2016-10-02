const SnowflakeError = require('./snowflakeError');

function SystemClockError(message, properties) {
    SnowflakeError.call(this, message, properties);
}

module.exports = SystemClockError;