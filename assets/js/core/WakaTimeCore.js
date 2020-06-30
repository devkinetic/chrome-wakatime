/* global chrome */
//jshint esnext:true

var $ = require('jquery');
var moment = require('moment');

var config = require('./../config');

// Helpers
var getDomainFromUrl = require('./../helpers/getDomainFromUrl');
var changeExtensionState = require('../helpers/changeExtensionState');
var in_array = require('./../helpers/in_array');
var contains = require('./../helpers/contains');

class WakaTimeCore {

    constructor() {
        this.tabsWithDevtoolsOpen = [];
        this.online = false;
    }

    /**
     * Settter for tabsWithDevtoolsOpen
     *
     * @param tabs
     */
    setTabsWithDevtoolsOpen(tabs) {
        this.tabsWithDevtoolsOpen = tabs;
    }

    getTotalTimeLoggedToday() {
        var deferredObject = $.Deferred();
        var today = moment().format('YYYY-MM-DD');

        $.ajax({
            url: config.summariesApiUrl + '?start=' + today + '&end=' + today,
            dataType: 'json',
            success: (data) => {

                deferredObject.resolve(data.data[0].grand_total);

            },
            error: (xhr, status, err) => {

                console.error(config.summariesApiUrl, status, err.toString());

                deferredObject.resolve(false);
            }
        });

        return deferredObject.promise();
    }

    getRanking() {
        var deferredObject = $.Deferred();

        $.ajax({
            url: config.rankingUrl,
            dataType: 'json',
            success: (data) => {

                deferredObject.resolve(data.data[0].rank);

            },
            error: (xhr, status, err) => {

                console.error(config.currentUserApiUrl, status, err.toString());

                deferredObject.resolve(false);
            }
        });

        return deferredObject.promise();
    }

    /**
     * Checks if the user is logged in.
     *
     * @returns {*}
     */
    checkAuth() {
        var deferredObject = $.Deferred();

        $.ajax({
            url: config.currentUserApiUrl,
            dataType: 'json',
            success: (data) => {
                this.online = true;

                deferredObject.resolve(data.data);

            },
            error: (xhr, status, err) => {
                this.online = false;
                console.error(config.currentUserApiUrl, status, err.toString());

                deferredObject.resolve(false);
            }
        });

        return deferredObject.promise();
    }

    /**
     * Depending on various factors detects the current active tab URL or domain,
     * and sends it to WakaTime for logging.
     */
    recordHeartbeat() {

        chrome.storage.sync.get({
            loggingEnabled: config.loggingEnabled,
            loggingStyle: config.loggingStyle,
            projectType: config.projectType,
            blacklist: '',
            whitelist: '',
            idelist: '',
        }, (items) => {
            if (items.loggingEnabled === true) {

                changeExtensionState('allGood');

                chrome.idle.queryState(config.detectionIntervalInSeconds, (newState) => {

                    if (newState === 'active') {
                        // Get current tab URL.
                        chrome.tabs.query({ active: true }, (tabs) => {

                            var currentActiveTab = tabs[0];
                            var debug = false;
                            var onidelist = false;

                            // If the current active tab has devtools open
                            if (in_array(currentActiveTab.id, this.tabsWithDevtoolsOpen)) {
                                debug = true;
                            }

                            // If the current active tab is a known web ide
                            if (contains(currentActiveTab.url, items.idelist)) {
                                onidelist = true;
                            }

                            if (items.loggingStyle == 'blacklist') {
                                if (!contains(currentActiveTab.url, items.blacklist)) {
                                    if (onidelist) {
                                        this.sendHeartbeat({
                                            url: currentActiveTab.url,
                                            project: null,
                                            type: 'app'
                                        }, debug,
                                            items.projectType);
                                    } else {
                                        this.sendHeartbeat({
                                            url: currentActiveTab.url,
                                            project: null,
                                        }, debug,
                                            items.projectType);
                                    }


                                }
                                else {
                                    changeExtensionState('blacklisted');
                                    console.log(currentActiveTab.url + ' is on a blacklist.');
                                }
                            }

                            if (items.loggingStyle == 'whitelist') {
                                var heartbeat = this.getHeartbeat(currentActiveTab.url, items.whitelist);
                                if (heartbeat.url && heartbeat.url.indexOf('@@') > 0) {
                                    if (onidelist) {
                                        heartbeat.type = 'app';
                                        this.sendHeartbeat(heartbeat, debug,
                                            items.projectType);
                                    } else {
                                        this.sendHeartbeat(heartbeat, debug,
                                            items.projectType);
                                    }
                                }
                                else {
                                    changeExtensionState('whitelisted');
                                    console.log(currentActiveTab.url + ' is not on a whitelist.');
                                }
                            }

                        });
                    }
                });
            }
            else {
                changeExtensionState('notLogging');
            }
        });
    }

    /**
     * Creates an array from list using \n as delimiter
     * and checks if any element in list is contained in the url.
     * Also checks if element is assigned to a project using @@ as delimiter
     *
     * @param url
     * @param list
     * @returns {object}
     */
    getHeartbeat(url, list) {
        var lines = list.split('\n');

        for (var i = 0; i < lines.length; i++) {
            // Trim all lines from the list one by one
            var cleanLine = lines[i].trim();

            // If by any chance one line in the list is empty, ignore it
            if (cleanLine === '') {
                continue;
            }

            // If url contains the current line return object
            if (url.indexOf(cleanLine.split('@@')[0]) > -1) {
                if (cleanLine.split('@@')[1]) {
                    return {
                        url: cleanLine.split('@@')[0],
                        project: cleanLine.split('@@')[1]
                    };
                }
                else {
                    return {
                        url: cleanLine.split('@@')[0],
                        project: null,
                    };
                }
            }
        }

        return {
            url: null,
            project: null,
        };
    }

    /**
     * Creates payload for the heartbeat and returns it as JSON.
     *
     * @param heartbeat
     * @param type
     * @param debug
     * @returns {*}
     * @private
     */
    _preparePayload(heartbeat, type, debug = false, project_type = 'last', plugin = 'browser-wakatime') {
        var json = null;

        if (project_type == 'last') {
            json = JSON.stringify({
                entity: heartbeat.url,
                type: type,
                time: moment().format('X'),
                project: heartbeat.project || '<<LAST_PROJECT>>',
                is_debugging: debug,
                plugin: plugin + '/' + config.version
            });
        } else {
            json = JSON.stringify({
                entity: heartbeat.url,
                type: type,
                time: moment().format('X'),
                project: heartbeat.project || config.defaultProjectName,
                is_debugging: debug,
                plugin: plugin + '/' + config.version
            });
        }
        return json;
    }


    /**
     * Returns a promise with logging type variable.
     *
     * @returns {*}
     * @private
     */
    _getLoggingType() {
        var deferredObject = $.Deferred();

        chrome.storage.sync.get({
            loggingType: config.loggingType
        }, function (items) {
            deferredObject.resolve(items.loggingType);
        });

        return deferredObject.promise();
    }

    /**
     * Returns a promise with project type variable.
     *
     * @returns {*}
     * @private
     */
    _getProjectType() {
        var deferredObject = $.Deferred();

        chrome.storage.sync.get({
            projectType: config.projectType
        }, function (items) {
            deferredObject.resolve(items.projectType);
        });

        return deferredObject.promise();
    }

    /**
     * Given the heartbeat and logging type it creates a payload and
     * sends an ajax post request to the API.
     *
     * @param heartbeat
     * @param debug
     */
    sendHeartbeat(heartbeat, debug, project_type = 'last') {
        var payload = null;
        var payloads = [];
        var type = '';
        var reply = false;
        var plugin = 'browser-wakatime';

        this._getLoggingType().done((loggingType) => {
            // Get only the domain from the entity.
            // And send that in heartbeat
            if (loggingType == 'domain') {

                type = loggingType;

                if ("type" in heartbeat) {
                    type = heartbeat.type;
                }

                if (type == 'app') {
                    plugin = 'browser_ide-wakatime';
                }

                heartbeat.url = getDomainFromUrl(heartbeat.url);
                payload = this._preparePayload(heartbeat, type, debug, project_type, plugin);
            
                this.sendAjaxRequestToApi(payload);
            
            } else if (loggingType == 'url') {

                type = loggingType;

                if ("type" in heartbeat) {
                    type = heartbeat.type;
                }

                if (type == 'app') {
                    plugin = 'browser_ide-wakatime';
                }

                payload = this._preparePayload(heartbeat, type, debug, project_type, plugin);
               
                this.sendAjaxRequestToApi(payload);
         
            }
        });
    }

    /**
     * Sends AJAX request with payload to the heartbeat API as JSON.
     *
     * @param payload
     * @param method
     * @returns {*}
     */
    sendAjaxRequestToApi(payload, method = 'POST') {

        var deferredObject = $.Deferred();

        $.ajax({
            url: config.heartbeatApiUrl,
            dataType: 'json',
            contentType: 'application/json',
            method: method,
            data: payload,
            statusCode: {
                401: function () {
                    changeExtensionState('notSignedIn');
                },
                201: function () {
                    // nothing to do here
                }
            },
            success: (response) => {
                deferredObject.resolve(this);
            },
            error: (xhr, status, err) => {
                console.error(config.heartbeatApiUrl, status, err.toString());

                deferredObject.resolve(this);
            }
        });

        return deferredObject.promise();

    }

}

export default WakaTimeCore;
