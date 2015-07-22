'use strict';

var assert = require('assert');

var credentials = require('../');

describe('Credentials module API', function() {

    it('returns a function', function() {
        assert.equal(typeof(credentials), 'function');
    });

    it('throws when called with invalid options object', function() {
        assert.throws(function() {
            credentials();
        }, /An options object containing .username and .password is required$/);

        assert.throws(function() {
            credentials({
                password: 'bar'
            });
        }, /Options object requires a .username property as a string$/);

        assert.throws(function() {
            credentials({
                username: 'foo'
            });
        }, /Options object requires a .password property as a string$/);
    });

    it('function returns a CredentialsAuthenticator instance', function() {
        var instance = credentials({
            username: 'foo',
            password: 'bar'
        });

        assert.equal(instance.constructor.name, 'CredentialsAuthenticator');
    });

});