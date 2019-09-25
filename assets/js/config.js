/* global chrome */
//jshint esnext:true

var config = {
    // Extension name
    name: 'WakaTime',
    // Extension version
    version: chrome.runtime.getManifest().version,
    // Time for idle state of the chrome
    // The user is considered idle if there was
    // no activity in the chrome for x seconds
    detectionIntervalInSeconds: 60,
    // Default Project Type
    projectType: 'last',
     // Default Project Name
    defaultProjectName: 'Unknown Project',
    // Default logging style
    // Log all except blacklisted sites
    // or log only the white listed sites.
    loggingStyle: 'blacklist',
    // Default logging type
    loggingType: 'domain',
    // Default ranking display type
    rankingDisplayType: 'global',
    // By default logging is enabled
    loggingEnabled: true,
    projectName: null,
    // Url to which to send the heartbeat
    heartbeatApiUrl: 'https://wakatime.com/api/v1/users/current/heartbeats',
    // Url from which to detect if the user is logged in
    currentUserApiUrl: 'https://wakatime.com/api/v1/users/current',
    // The url to logout the user from wakatime
    logoutUserUrl: 'https://wakatime.com/logout',
    // The url to logout the user from wakatime
    rankingUrl: 'https://wakatime.com/api/v1/leaders',
    // Gets stats from the WakaTime API
    summariesApiUrl: 'https://wakatime.com/api/v1/users/current/summaries',
    // Different colors for different states of the extension
    colors: {
        allGood: '',
        allGoodOverride: 'override',
        notLogging: 'gray',
        notSignedIn: 'red',
        lightTheme: 'white'
    },
    // Tooltips for each of the extension states
    tooltips: {
        allGood: '',
        allGoodOverride: 'Project name has been overridden',
        notLogging: 'Not logging',
        notSignedIn: 'Not signed In',
        blacklisted: 'This URL is blacklisted',
        whitelisted: 'This URL is not on your whitelist'
    },
    // Default theme
    theme: 'light',
    // Valid extension states
    states: [
        'allGood',
        'allGoodOverride',
        'notLogging',
        'notSignedIn',
        'blacklisted',
        'whitelisted'
    ],
    languagesToDisplay: [],
    // Predefined alert type and text for success and failure.
    alert: {
        success: {
            type: 'success',
            text: 'Options have been saved!'
        },
        failure: {
            type: 'danger',
            text: 'There was an error while saving the options!'
        }
    }
};

module.exports = config;
