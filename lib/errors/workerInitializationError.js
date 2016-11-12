const SnowflakeError = require('./snowflakeError');

function WorkerInitializationError (message, properties) {
  SnowflakeError.call(this, message, properties);
}

module.exports = WorkerInitializationError;