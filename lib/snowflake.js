'use strict';

const Promise = require('bluebird');
const BigInteger = require('jsbn').BigInteger;

const WorkerInitializationError = require('./errors/workerInitializationError');
const SystemClockError = require('./errors/systemClockError');

const TWEPOCH = 1471745682338;

function Snowflake(datacenterId, workerId, sequence) {

    this.lastTimestamp = getTime();

    this.datacenterId = datacenterId | 0;
    this.workerId = workerId | 0;
    this.sequence = sequence | 0;

    this.BITS = {
        SEQUENCE: 12,
        WORKER_ID: 6,
        DATACENTER_ID: 4
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

    if (this.workerId > this.MAX.WORKERS || this.workerId < 0)
        return Promise.reject(new WorkerInitializationError('Worker id must be greater than 0 and lower than ' + this.MAX.WORKERS));

    if (this.datacenterId > this.MAX.DATACENTERS || this.datacenterId < 0)
        return Promise.reject(new WorkerInitializationError('Datacenter id must be greater than 0 and lower than ' + this.MAX.DATACENTERS));

    return Promise.resolve(this);
}

Snowflake.prototype.getId = function () {
    var timestamp = getTime();

    if (timestamp < this.lastTimestamp)
        return Promise.reject(new SystemClockError('Clock moved backwards. Refusing to generate IDs for ' + (this.lastTimestamp - timestamp) + ' milliseconds.'));

    if (this.lastTimestamp === timestamp) {
        this.sequence = (this.sequence + 1) & this.MAX.SEQUENCE;
        if (this.sequence === 0) {
            timestamp = (function tilNextMillis(lastTimestamp) {
                let timestamp = getTime();
                if (timestamp <= lastTimestamp) return tilNextMillis(lastTimestamp);
                return timestamp;
            })(this.lastTimestamp);
        }
    } else this.sequence = 0;

    this.lastTimestamp = timestamp;
    var shiftNum = (this.datacenterId << this.SHIFT.DATACENTER_ID) |
        (this.workerId << this.SHIFT.WORKER_ID) |
        this.sequence;
    var nfirst = new BigInteger(String(timestamp - TWEPOCH), 10);
    nfirst = nfirst.shiftLeft( this.SHIFT.TIMESTAMP);
    var nnextId = nfirst.or(new BigInteger(String(shiftNum), 10));
    var nextId = nnextId.toRadix(10);
    return Promise.resolve(nextId);
};


function getTime() {
    return new Date().getTime();
}

module.exports = Snowflake;