'use strict';

var assert = require('assert');
var sinon = require('sinon');

var server = require('./server');

var credentials = require('../');

describe('authenticate(apiOptions, callback)', function() {

    var instance;

    beforeEach(function() {
        server.start();

        instance = credentials({
            username: 'foo',
            password: 'bar'
        });
    });

    afterEach(server.stop);

    it('is a function', function() {
        assert.equal(typeof(instance.authenticate), 'function');
    });

    it('requires the plex-api options as first argument', function() {
        assert.throws(function() {
            instance.authenticate();
        }, /First argument should be the plex-api options object$/);
    });

    it('requires callback function as second argument', function() {
        assert.throws(function() {
            instance.authenticate({});
        }, /Second argument should be a callback function to be called when authentication has finished$/);
    });

    describe('callback(err, token)', function() {

        it('calls function with null as err argument when succeeding', function(done) {
            instance.authenticate({}, function(err) {
                assert.strictEqual(err, null);
                done();
            });
        });

        it('calls function with error object as err argument when error occurs', function(done) {
            server.fails();

            instance.authenticate({}, function(err) {
                assert(err instanceof Error, 'error instance provided');
                done();
            });
        });

    });

    describe('event: token', function() {

        it('emits when token has been retrieved', function(done) {
            var spy = sinon.spy();

            instance.on('token', spy);

            instance.authenticate({}, function() {
                assert(spy.calledOnce);
                done();
            });
        });

        it('emitted with the retrieved token', function(done) {
            var spy = sinon.spy();

            instance.on('token', spy);

            instance.authenticate({}, function() {
                var token = spy.firstCall.args[0];
                assert.equal(token, 'pretend-to-be-token');
                done();
            });
        });

    });

    describe('HTTP headers', function() {

        it('uses username / password in a basic Authorization header when requesting plex.tv', function(done) {
            server.stop();

            var scope = server.start({
                reqheaders: {
                    'Authorization': 'Basic Zm9vOmJhcg=='
                }
            });

            instance.authenticate({}, function() {
                scope.done();
                done();
            });
        });

        it('overrides default options when specified', function(done) {
            server.stop();

            var scope = server.start({
                reqheaders: {
                    'X-Plex-Client-Identifier': 'mock-identifier',
                    'X-Plex-Product'          : 'mock-product',
                    'X-Plex-Version'          : 'mock-version',
                    'X-Plex-Device'           : 'mock-device'
                }
            });

            instance.authenticate({
                identifier: 'mock-identifier',
                product   : 'mock-product',
                version   : 'mock-version',
                device    : 'mock-device'
            }, function() {
                scope.done();
                done();
            });
        });

    });
});