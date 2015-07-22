'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var request = require('request');

var rxAuthToken = /authenticationToken="([^"]+)"/;

function CredentialsAuthenticator(username, password) {
    EventEmitter.call(this);

    this.username = username;
    this.password = password;
}
util.inherits(CredentialsAuthenticator, EventEmitter);

CredentialsAuthenticator.prototype.authenticate = function authenticate(apiOptions, callback) {
    if (typeof (apiOptions) !== 'object') {
        throw new TypeError('First argument should be the plex-api options object');
    }
    if (typeof (callback) !== 'function') {
        throw new TypeError('Second argument should be a callback function to be called when authentication has finished');
    }

    this._requestSignIn(apiOptions, callback);
};

CredentialsAuthenticator.prototype._requestSignIn = function _requestSignIn(apiOptions, callback) {
    var self = this;
    var options = {
        url: 'https://plex.tv/users/sign_in.xml',
        headers: {
            'Authorization': authHeaderVal(this.username, this.password),
            'X-Plex-Client-Identifier': apiOptions.identifier,
            'X-Plex-Product': apiOptions.product,
            'X-Plex-Version': apiOptions.version,
            'X-Plex-Device': apiOptions.device,
            'X-Plex-Device-Name': apiOptions.deviceName,
            'X-Plex-Platform': apiOptions.platform,
            'X-Plex-Platform-Version': apiOptions.platformVersion,
            'X-Plex-Provides': 'controller'
        }
    };

    request.post(options, function(err, res, xmlBody) {
        if (err) {
            return callback(new Error('Error while requesting https://plex.tv for authentication: ' + String(err)));
        }
        if (res.statusCode !== 201) {
            return callback(new Error('Invalid status code in authentication response from Plex.tv, expected 201 but got ' + res.statusCode));
        }

        var token = extractAuthToken(xmlBody);
        if (!token) {
            return callback(new Error('Couldnt not find authentication token in response from Plex.tv :('));
        }

        self.emit('token', token);
        callback(null, token);
    });
};

function extractAuthToken(xmlBody) {
    return xmlBody.match(rxAuthToken)[1];
}

function authHeaderVal(username, password) {
    var authString = username + ':' + password;
    var buffer = new Buffer(authString.toString(), 'binary');
    return 'Basic ' + buffer.toString('base64');
}

module.exports = function(options) {
    if (typeof (options) !== 'object') {
        throw new TypeError('An options object containing .username and .password is required');
    }
    if (typeof (options.username) !== 'string') {
        throw new TypeError('Options object requires a .username property as a string');
    }
    if (typeof (options.password) !== 'string') {
        throw new TypeError('Options object requires a .password property as a string');
    }
    return new CredentialsAuthenticator(options.username, options.password);
};
