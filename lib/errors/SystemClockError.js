const SnowflakeError = require('./snowflakeError');

function SystemClockError(message) {
    SnowflakeError.call(this, message);
}

module.exports = SystemClockError;