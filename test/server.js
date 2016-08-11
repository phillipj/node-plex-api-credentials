'use strict';

var fs = require('fs');
var nock = require('nock');

var respondWith;

function respondWithFixture(fixtureFilename, cb) {
    fs.readFile(`${__dirname}/fixtures/${fixtureFilename}`, function onReadSignIn(err, data) {
        if (err) {
            return cb(err);
        }
        cb(null, [201, data.toString()]);
    });
}

module.exports = {
    start(options) {
        options = options || {};

        return nock('https://plex.tv', {
                    reqheaders: options.reqheaders
                })
                .post('/users/sign_in.xml')
                .reply((uri, requestBody, cb) => {
                    if (respondWith === 'failure') {
                        return cb(null, [500]);
                    }
                    respondWithFixture('sign_in.xml', cb);
                });
    },

    stop() {
        respondWith = undefined;
        nock.cleanAll();
    },

    fails() {
        respondWith = 'failure';
    },

    expectManagedUserRequest() {
        return nock('https://plex.tv')
                .get('/api/home/users')
                .reply((uri, requestBody, cb) => {
                    if (respondWith === 'failure') {
                        return cb(null, [500]);
                    }
                    respondWithFixture('managed_users.xml', cb);
                })
                .post('/api/home/users/4321/switch?')
                .reply((uri, requestBody, cb) => respondWithFixture('switch_user.xml', cb))
                .get('/api/resources?includeHttps=1')
                .reply((uri, requestBody, cb) => respondWithFixture('fetch_access_token.xml', cb));
    }
};