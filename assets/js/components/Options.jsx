/* global chrome */

var React = require('react');

var createReactClass = require('create-react-class');
var ReactCSSTransitionGroup = require('react-transition-group/CSSTransitionGroup');


var config = require('../config');

// React components
var Alert = require('./Alert.jsx');
var SitesList = require('./SitesList.jsx');

/**
 * One thing to keep in  mind is that you cannot use this.refs.blacklist if
 * the blacklist select box is not being rendered on the form.
 *
 * @type {*|Function}
 */
var Options = createReactClass({

    getInitialState: function () {
        return {
            theme: config.theme,
            blacklist: '',
            whitelist: '',
            idelist: '',
            projectType: 'last',
            loggingType: config.loggingType,
            loggingStyle: config.loggingStyle,
            displayAlert: false,
            defaultProjectName: config.defaultProjectName,
            alertType: config.alert.success.type,
            alertText: config.alert.success.text
        };
    },

    componentDidMount: function () {
         this.restoreSettings();
    },

    restoreSettings: function () {
        var that = this;

        chrome.storage.sync.get({
            theme: config.theme,
            blacklist: '',
            whitelist: '',
            idelist: '',
            projectType: 'last',
            loggingType: config.loggingType,
            loggingStyle: config.loggingStyle,
            defaultProjectName: config.defaultProjectName,
        }, function (items) {
            that.setState({
                theme: items.theme,
                blacklist: items.blacklist,
                whitelist: items.whitelist,
                idelist: items.idelist,
                projectType: items.projectType,
                loggingType: items.loggingType,
                loggingStyle: items.loggingStyle,
                defaultProjectName: items.defaultProjectName,
            });

            that.refs.theme.value = items.theme;
            that.refs.projectType.value = items.projectType;
            that.refs.loggingType.value = items.loggingType;
            that.refs.loggingStyle.value = items.loggingStyle;
            that.refs.defaultProjectName.value = items.defaultProjectName;
        });
    },

    _handleSubmit: function (e) {
        e.preventDefault();

        this.saveSettings();
    },

    saveSettings: function () {
        var that = this;

        var theme = this.refs.theme.value.trim();
        var loggingType = this.refs.loggingType.value.trim();
        var projectType = this.refs.projectType.value.trim();
        var loggingStyle = this.refs.loggingStyle.value.trim();
        var defaultProjectName = this.refs.defaultProjectName.value.trim();
        // Trimming blacklist and whitelist removes blank lines and spaces.
        var blacklist = that.state.blacklist.trim();
        var whitelist = that.state.whitelist.trim();
        var idelist = that.state.idelist.trim();

        // Sync options with google storage.
        chrome.storage.sync.set({
            theme: theme,
            blacklist: blacklist,
            whitelist: whitelist,
            idelist: idelist,
            loggingType: loggingType,
            projectType: projectType,
            loggingStyle: loggingStyle,
            defaultProjectName: defaultProjectName
        }, function () {
            // Set state to be newly entered values.
            that.setState({
                theme: theme,
                blacklist: blacklist,
                whitelist: whitelist, 
                idelist: idelist,
                loggingType: loggingType,
                projectType: projectType,
                loggingStyle: loggingStyle,
                defaultProjectName: defaultProjectName,
                displayAlert: true
            });
        });
    },

    _displayBlackOrWhiteList: function () {
        var loggingStyle = this.refs.loggingStyle.value.trim();

        this.setState({loggingStyle: loggingStyle});
    },

    _updateBlacklistState: function(sites){
        this.setState({
            blacklist: sites
        });
    },

    _updateDefaultProjectState: function(event){
        this.setState({
            defaultProjectName: event.target.value
        });
    },

    _updateWhitelistState: function(sites){
        this.setState({
            whitelist: sites
        });
    },

        _updateIdelistState: function(sites){
            this.setState({
                idelist: sites
            });
    },
       
    _updateTypeState: function(type){
            this.setState({
                projectType: type
            });
    },

    render: function () {

        var that = this;

        var alert = function() {
            if(that.state.displayAlert === true){

                setTimeout(function () {
                    that.setState({displayAlert:false});
                }, 2000);

                return(
                    <Alert key={that.state.alertText} type={that.state.alertType} text={that.state.alertText} />
                );
            }
        };

        var loggingStyle = function () {


            if (that.state.loggingStyle == 'blacklist') {
                return (
                    <SitesList
                        handleChange={that._updateBlacklistState}
                        label="Blacklist"
                        sites={that.state.blacklist}
                        helpText="Sites that you don't want to show in your reports." />
                );
            }

            return (
              <SitesList
                  handleChange={that._updateWhitelistState}
                  label="Whitelist"
                  sites={that.state.whitelist}
                  placeholder="http://google.com&#10;http://myproject.com@@MyProject"
                  helpText="Sites that you want to show in your reports. You can assign URL to project by adding @@YourProject at the end of line." />
            );
            
        };


        var ideList = function () {
            
            return (
                <SitesList
                    handleChange={that._updateIdelistState}
                    label="Idelist"
                    sites={that.state.idelist}
                    helpText="Sites that you want to show in your reports as codeing." />
            );
        };
        
        var projectType = function () {
            
            return (
                <div className="form-group">
                <label className="col-lg-2 control-label">Project Selection</label>

                <div className="col-lg-10">
                    <select className="form-control" ref="projectType" defaultValue="last" onChange={that._updateTypeState}>
                        <option value="last">The last project reported to Wakatime</option>
                        <option value="unknown">Unknown/New project</option>
                    </select>
                </div>
            </div>
            );
        };
        
        var defaultProjectName = function () {
            
            return (
                <div className="form-group">
                <label className="col-lg-2 control-label">Default Project Name</label>

                <div className="col-lg-10">
                    <input className="form-control" ref="defaultProjectName" defaultValue="Unknown Project" onChange={that._updateDefaultProjectState} />
                </div>
            </div>
            );
        };

        return (
            <div className="container">
                <div className="row">
                    <div className="col-md-12">

                        <ReactCSSTransitionGroup transitionName="alert" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
                            {alert()}
                        </ReactCSSTransitionGroup>

                        <form className="form-horizontal" onSubmit={this._handleSubmit}>

                            <div className="form-group">
                                <label className="col-lg-2 control-label">Logging style</label>

                                <div className="col-lg-10">
                                    <select className="form-control" ref="loggingStyle" defaultValue="blacklist" onChange={this._displayBlackOrWhiteList}>
                                        <option value="blacklist">All except blacklisted sites</option>
                                        <option value="whitelist">Only whitelisted sites</option>
                                    </select>
                                </div>
                            </div>

                            {(defaultProjectName())}

                            {projectType()}

                            {loggingStyle()}

                            {ideList()}

                            <div className="form-group">
                                <label className="col-lg-2 control-label">Logging type</label>

                                <div className="col-lg-10">
                                    <select className="form-control" ref="loggingType" defaultValue="domain">
                                        <option value="domain">Only the domain</option>
                                        <option value="url">Entire URL</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="theme" className="col-lg-2 control-label">Icon Theme</label>

                                <div className="col-lg-10">
                                    <select className="form-control" ref="theme" defaultValue="light">
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="col-lg-10 col-lg-offset-2">
                                    <button type="submit" className="btn btn-primary">Save</button>
                                </div>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
        );
    }
});

module.exports = Options;
