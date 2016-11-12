![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)

# Node implementation of [Twitter Snowflake](https://github.com/twitter/snowflake)

Inspired by [kurten's repository](https://github.com/Welogix-Tech/node-snowflake).

Working on to improve its features.

## Usage

_Add snowflake id to your mongoose schemas_

```
'use strict';

const Snowflake = require('node-snowflake');

module.exports = (datacenterId, workerId, retry) => {
    var worker = new Snowflake.Worker({
        datacenterId: datacenterId,
        workerId: workerId,
        retry: retry === false ? retry : true
    });

    return (schema, options) => {
        schema.add({
            n_id: {
                type: String,
                required: true,
                unique: true,
                index: true
            }
        });

        schema.pre('validate', function (next) {
            if (this.n_id) return next();
            return worker
                .getId()
                .then(id => {
                    this.n_id = id;
                    next();
                })
                .catch(next);
        });
    };
}
``
