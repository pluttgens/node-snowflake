'use strict';

const chai = require('chai');
const expect = chai.expect;
const Promise = require('bluebird');

const Snowflake = require('../index');


function getSnowflakeWorker() {
    return new Snowflake.Worker({
        datacenterId: 0,
        workerId: 0
    });
}

describe('Snowflake-worker', function () {

    describe('#nextId()', function () {
        beforeEach(function () {
            this._snowflakeWorker = getSnowflakeWorker();
        });

        it('should be defined.', function (done) {
            this._snowflakeWorker
                .getId()
                .then(id => {
                    expect(id).to.be.ok;
                    done();
                })
                .catch(done);
        });

        it('should be strictly greater than 0.', function (done) {
            this._snowflakeWorker
                .getId()
                .then(id => {
                    expect(id).to.be.at.least(0);
                    done();
                })
                .catch(done);
        });

        it('should not generate identical IDs.', function (done) {
            this.timeout(10000);
            var promises = [];
            var ids = [];
            for (let i = 0; i < 10000; ++i) {
                promises.push(this._snowflakeWorker
                    .getId()
                    .then(id => {
                        expect(ids).to.not.include(id);
                        ids.push(id);
                    }));
            }
            Promise
                .all(promises)
                .then(() => done())
                .catch(done);
        });

        it('should return an error when system clock went backward.', function (done) {
            this._snowflakeWorker.lastTimestamp = new Date().getTime() + 50000;
            this._snowflakeWorker
                .getId()
                .then(() => done('Should not be successful.'))
                .catch(err => done());
        });
        
        it('should support a callback as parameter.', function (done) {
            this._snowflakeWorker.getId((err, id) => {
                if (err || !id) return done(err || 'No id and no error.');
                this._snowflakeWorker.lastTimestamp = new Date().getTime() + 50000;
                this._snowflakeWorker.getId((err, id) => {
                    if (err) return done();
                    done('Expected an error.');
                });
            });
        });

        it('should retry on its own if an error happened.', function (done) {
            this.timeout(10000);
            this._snowflakeWorker = new Snowflake.Worker({
                datacenterId: 0,
                workerId: 0,
                retry: true
            });
            this._snowflakeWorker.lastTimeStamp = new Date().getTime() + 3000;
            this._snowflakeWorker
                .getId()
                .then(id => {
                    expect(id).to.be.ok;
                    this._snowflakeWorker.lastTimeStamp = new Date().getTime() + 3000;
                    this._snowflakeWorker.getId((err, id) => {
                        if (err) return done(err);
                        expect(id).to.be.ok;
                        done();
                    });
                })
                .catch(done);
        });
    });
});