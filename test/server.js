'use strict';

var fs = require('fs');
var nock = require('nock');

var respondWith;

function respondWithSignInXml(cb) {
    fs.readFile(__dirname + '/fixtures/sign_in.xml', function onReadSignIn(err, data) {
        if (err) {
            return cb(err);
        }
        cb(null, [201, data.toString()]);
    });
}

module.exports = {
    start: function start(options) {
        options = options || {};

        return nock('https://plex.tv', {
                    reqheaders: options.reqheaders
                })
                .post('/users/sign_in.xml')
                .reply(function(uri, requestBody, cb) {
                    if (respondWith === 'failure') {
                        return cb(null, [500]);
                    }
                    respondWithSignInXml(cb);
                });
    },

    stop: function stop() {
        respondWith = undefined;
        nock.cleanAll();
    },

    fails: function fails() {
        respondWith = 'failure';
    }
};