const SnowflakeError = require('./snowflakeError');

function WorkerInitializationError(message) {
    SnowflakeError.call(this, message);
}

module.exports = WorkerInitializationError;