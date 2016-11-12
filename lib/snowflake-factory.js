'use strict';

function SnowflakeFactory (options) {
  this.twepoch = options.twepoch || 1471873582092;
  this.maxWorkers = options.maxWorkers || 32;
  this.maxSequence = options.maxSequence || 4096;
  this.datacenterId = options.datacenterId;
  this.retry = options.retry || false;
}