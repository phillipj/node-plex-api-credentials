'use strict';

var assert = require('assert');
var sinon = require('sinon');
var PlexAPI = require('plex-api');

var server = require('./server');

var credentials = require('../');

describe('authenticate(plexApi, callback)', function() {

    var instance;
    var plexClient;

    beforeEach(function() {
        server.start();

        plexClient = new PlexAPI({
            hostname: 'localhost',
            options: {
                deviceName: 'My awesome Plex Controller'
            }
        });

        instance = credentials({
            username: 'foo',
            password: 'bar'
        });
    });

    afterEach(server.stop);

    it('is a function', function() {
        assert.equal(typeof(instance.authenticate), 'function');
    });

    it('requires the plex-api instance as first argument', function() {
        assert.throws(function() {
            instance.authenticate();
        }, /First argument should be the plex-api object/);
    });

    it('requires callback function as second argument', function() {
        assert.throws(function() {
            instance.authenticate(plexClient);
        }, /Second argument should be a callback function to be called when authentication has finished$/);
    });

    describe('callback(err, token)', function() {

        it('calls function with null as err argument when succeeding', function(done) {
            instance.authenticate(plexClient, function(err) {
                assert.strictEqual(err, null);
                done();
            });
        });

        it('calls function with error object as err argument when error occurs', function(done) {
            server.fails();

            instance.authenticate(plexClient, function(err) {
                assert(err instanceof Error, 'error instance provided');
                done();
            });
        });

    });

    describe('event: token', function() {

        it('emits when token has been retrieved', function(done) {
            var spy = sinon.spy();

            instance.on('token', spy);

            instance.authenticate(plexClient, function() {
                assert(spy.calledOnce);
                done();
            });
        });

        it('emitted with the retrieved token', function(done) {
            var spy = sinon.spy();

            instance.on('token', spy);

            instance.authenticate(plexClient, function() {
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
                    'Authorization': 'Basic Zm9vOmJhcg==',
                    'X-Plex-Device-Name': 'My awesome Plex Controller'
                }
            });

            instance.authenticate(plexClient, function() {
                scope.done();
                done();
            });
        });

    });
});