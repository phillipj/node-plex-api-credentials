'use strict';

var EventEmitter = require('events').EventEmitter;
var Promise      = require('bluebird');
var util         = require('util');
var request      = require('request-promise');
var headers      = require('plex-api-headers');
var parseString  = Promise.promisify(require('xml2js').parseString);
var errors       = require('request-promise/errors');

var rxAuthToken = /authenticationToken="([^"]+)"/;

function CredentialsAuthenticator(options) {
    EventEmitter.call(this);

    this.username = options.username;
    this.password = options.password;
    this.homeUser = options.managedUser;
}
util.inherits(CredentialsAuthenticator, EventEmitter);

CredentialsAuthenticator.prototype.authenticate = function authenticate(plexApi, callback) {
    var self = this;
    var options;

    if (typeof plexApi !== 'object') {
        throw new TypeError('First argument should be the plex-api object to perform authentication for');
    }
    if (typeof callback !== 'function') {
        throw new TypeError('Second argument should be a callback function to be called when authentication has finished');
    }

    options = {
        url: 'https://plex.tv/users/sign_in.xml',
        headers: headers(plexApi, {
            Authorization: authHeaderVal(this.username, this.password)
        })
    };

    return request.post(options)
        .then(xmlBody => {
            let token = extractAuthToken(xmlBody);

            if (!token) {
                throw new Error('Couldnt not find authentication token in response from Plex.tv :(');
            }

            self.emit('authToken', token);

            return token;
        })
        .catch(errors.StatusCodeError, err => {
            throw new Error('Invalid status code in authentication response from Plex.tv, expected 201 but got ' + err.statusCode);
        })
        .catch(errors.RequestError, err => {
            throw new Error('Error while requesting https://plex.tv for authentication: ' + String(err));
        })
        .then(token => {
            if (self.homeUser && self.homeUser.name) {
                let plexContext = {
                    plexApi : plexApi,
                    token   : token
                };

                return getHomeUser(plexContext)
                    .then(xml  => findUserByName(xml, self.homeUser.name))
                    .then(user => switchUser(plexContext, user, self.homeUser.pin))
                    .then(extractAuthToken)
                    .then(token => getAccessToken({token : token, plexApi : plexApi}))
                    .then(accessToken => {
                        self.emit('accessToken', accessToken);
                        self.emit('token', accessToken);
                        return token;
                    });
            }
            self.emit('token', token);
            return token;
        })
        .asCallback(callback);
};

function getHomeUser(plexContext) {
    return request.get(createRequestOpts(plexContext, 'https://plex.tv/api/home/users'));
}

function createRequestOpts(plexContext, url) {
    return {
        url     : url,
        headers : headers(plexContext.plexApi, { 'X-Plex-Token': plexContext.token })
    };
}

function getAccessToken(plexContext, callback) {
    return request.get(createRequestOpts(plexContext, 'https://plex.tv/api/resources?includeHttps=1'))
        .then(parseString)
        .then(extractAccessToken);
}

function extractAccessToken(result) {
    let token = null;
    let hasDevices = result.MediaContainer.Device && result.MediaContainer.Device.some(device => {
        token = device.$.accessToken;
        return true;
    });

    if (hasDevices) {
        return token;
    }

    throw new Error('Couldn\'t find any devices this managed user has access to');
}

function switchUser(plexContext, user, pin, callback) {
    let url = 'https://plex.tv/api/home/users/' + user.id + '/switch?' + (user.protected && pin  ? ('pin=' + pin) : '');
    return request.post(createRequestOpts(plexContext, url));
}

function findUserByName(xml, homeUser) {
    return parseString(xml)
        .then(result => {
            let foundUser = {
                protected : false,
                name      : null,
                id        : null
            };

            let found = result.MediaContainer.User.some((user) => {
                if (user.$.title.toLocaleLowerCase() == homeUser.toLocaleLowerCase()) {
                    foundUser.id        = user.$.id;
                    foundUser.name      = user.$.title;
                    foundUser.protected = user.$.protected === '1';
                    return true;
                }
                return false;
            });

            if (found) {
                return foundUser;
            }

            throw new Error('Home user ' + homeUser + ' not found');
        });
}

function extractAuthToken(xmlBody) {
    return xmlBody.match(rxAuthToken)[1];
}

function authHeaderVal(username, password) {
    var authString = username + ':' + password;
    var buffer = new Buffer(authString.toString(), 'binary');
    return 'Basic ' + buffer.toString('base64');
}

module.exports = function (options) {
    if (typeof (options) !== 'object') {
        throw new TypeError('An options object containing .username and .password is required');
    }
    if (typeof (options.username) !== 'string') {
        throw new TypeError('Options object requires a .username property as a string');
    }
    if (typeof (options.password) !== 'string') {
        throw new TypeError('Options object requires a .password property as a string');
    }
    return new CredentialsAuthenticator(options);
};
