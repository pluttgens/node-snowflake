'use strict';

const Promise = require('bluebird');
const BigInteger = require('jsbn').BigInteger;

const WorkerInitializationError = require('./errors/workerInitializationError');
const SystemClockError = require('./errors/systemClockError');


function SnowflakeWorker (options) {
  if (!options) options = {};

  this.twepoch = options.twepoch || 1471873582092;

  this.lastTimestamp = getTime();

  this.datacenterId = options.datacenterId || 0;
  this.workerId = options.workerId || 0;
  this.sequence = options.sequence || 0;

  this.BITS = {
    SEQUENCE: options.sequenceLength || 12,
    WORKER_ID: options.workerIdLength || 5,
    DATACENTER_ID: options.datacenterIdLength || 5
  };
  this.SHIFT = {
    WORKER_ID: this.BITS.SEQUENCE,
    DATACENTER_ID: this.BITS.WORKER_ID + this.BITS.SEQUENCE,
    TIMESTAMP: this.BITS.DATACENTER_ID + this.BITS.WORKER_ID + this.BITS.SEQUENCE
  };
  this.MAX = {
    SEQUENCE: (~(-1 << this.BITS.SEQUENCE)),
    WORKERS: (~(-1 << this.BITS.WORKER_ID)),
    DATACENTERS: (~(-1 << this.BITS.DATACENTER_ID))
  };

  this.retry = options.retry;

  if (!isNaN(this.datacenterId) && this.workerId > this.MAX.WORKERS || this.workerId < 0)
    throw new WorkerInitializationError('Worker ID must be a number greater than 0 and lower than ' + this.MAX.WORKERS);

  if (!isNaN(this.datacenterId) && this.datacenterId > this.MAX.DATACENTERS || this.datacenterId < 0)
    throw new WorkerInitializationError('Datacenter ID must be a number greater than 0 and lower than ' + this.MAX.DATACENTERS);
}

SnowflakeWorker.prototype.getId = function (callback) {
  var timestamp = getTime();

  if (timestamp < this.lastTimestamp) {
    if (!this.retry) {
      let error = new SystemClockError('Clock moved backwards. Refusing to generate IDs for ' + (this.lastTimestamp - timestamp) + ' milliseconds.',
        {delayBeforeRetry: this.lastTimestamp - timestamp});
      if (callback) return callback(error);
      return Promise.reject(error);
    }
    if (callback) return setTimeout(this.getId.bind(this, callback), this.lastTimestamp - timestamp);
    return Promise
      .resolve()
      .timeout(this.lastTimestamp - timestamp)
      .then(() => this.getId());
  }


  if (this.lastTimestamp === timestamp) {
    this.sequence = (this.sequence + 1) & this.MAX.SEQUENCE;
    if (this.sequence === 0) {
      timestamp = (function tilNextMillis (lastTimestamp) {
        let timestamp = getTime();
        if (timestamp <= lastTimestamp) return tilNextMillis(lastTimestamp);
        return timestamp;
      })(this.lastTimestamp);
    }
  } else this.sequence = 0;

  this.lastTimestamp = timestamp;
  var rightPart = (this.datacenterId << this.SHIFT.DATACENTER_ID) |
    (this.workerId << this.SHIFT.WORKER_ID) |
    this.sequence;

  var id = new BigInteger(String(timestamp - this.twepoch), 10)
    .shiftLeft(this.SHIFT.TIMESTAMP)
    .or(new BigInteger(String(rightPart), 10))
    .toRadix(10);
  if (callback) return callback(null, id);
  return Promise.resolve(id);
};

SnowflakeWorker.prototype.getReverseId = function (callback) {
  if (!callback) return this.getId().then(id => id.split('').reverse().join(''));
  this.getId((err, id) => callback(err, id.split('').reverse().join('')));
}

SnowflakeWorker.debugId = (id, fields) => {
  var binaryId = new BigInteger(id, 10).toRadix(2);
  console.log(binaryId.toString);
};


function getTime () {
  return new Date().getTime();
}

module.exports = SnowflakeWorker;