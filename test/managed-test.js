'use strict';

var assert = require('assert');
var sinon = require('sinon');
var PlexAPI = require('plex-api');

var server = require('./server');

var credentials = require('../');

describe('authenticate(plexApi, callback) with managed PlexHome user', () => {

    var instance;
    var plexClient;

    beforeEach(() => {
        server.start();
        server.expectManagedUserRequest();

        plexClient = new PlexAPI({
            hostname: 'localhost',
            options: {
                deviceName: 'My awesome Plex Controller'
            }
        });

        instance = credentials({
            username: 'Parent user',
            password: 'randompassword',
            managedUser: {
              name: 'OnlyPhotos',
              pin: '1234'
            }
        });
    });

    afterEach(server.stop);

    describe('event: "token"', () => {

        it('emits when token for managed user has been retrieved', (done) => {
            var spy = sinon.spy();

            instance.on('token', spy);

            instance.authenticate(plexClient, (err) => {
                assert.equal(err, null);
                assert(spy.calledTwice);
                done();
            });
        });

        it('emitted with the retrieved tokens', (done) => {
            var spy = sinon.spy();

            instance.on('token', spy);

            instance.authenticate(plexClient, () => {
                assert.equal(spy.firstCall.args[0], 'pretend-to-be-token');
                assert.equal(spy.secondCall.args[0], 'pretend-to-be-managed-token');
                done();
            });
        });

    });
});
