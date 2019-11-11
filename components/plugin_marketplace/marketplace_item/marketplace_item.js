// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {FormattedMessage} from 'react-intl';

import {Link} from 'react-router-dom';

import LoadingWrapper from 'components/widgets/loading/loading_wrapper.tsx';
import PluginIcon from 'components/widgets/icons/plugin_icon.jsx';

import {trackEvent} from 'actions/diagnostics_actions.jsx';
import {localizeMessage} from 'utils/utils';

// UpdateVersion renders the version text in the update details, linking out to release notes if available.
export const UpdateVersion = ({version, releaseNotesUrl}) => {
    if (!releaseNotesUrl) {
        return version;
    }

    return (
        <a
            target='_blank'
            rel='noopener noreferrer'
            href={releaseNotesUrl}
        >
            {version}
        </a>
    );
};

UpdateVersion.propTypes = {
    version: PropTypes.string.isRequired,
    releaseNotesUrl: PropTypes.string,
};

// UpdateDetails renders an inline update prompt for plugins, when available.
export const UpdateDetails = ({availableVersion, releaseNotesUrl, installedVersion, isInstalling, onUpdate}) => {
    if (!installedVersion || installedVersion === availableVersion || isInstalling) {
        return null;
    }

    return (
        <div className={classNames('update')}>
            <FormattedMessage
                id='marketplace_modal.list.update_available'
                defaultMessage='Update available:'
            />
            {' '}
            <UpdateVersion
                version={availableVersion}
                releaseNotesUrl={releaseNotesUrl}
            />
            {' - '}
            <b>
                <a onClick={onUpdate}>
                    <FormattedMessage
                        id='marketplace_modal.list.update'
                        defaultMessage='Update'
                    />
                </a>
            </b>
        </div>
    );
};

UpdateDetails.propTypes = {
    availableVersion: PropTypes.string.isRequired,
    releaseNotesUrl: PropTypes.string,
    installedVersion: PropTypes.string,
    isInstalling: PropTypes.bool.isRequired,
    onUpdate: PropTypes.func.isRequired,
};

export class MarketplaceItem extends React.Component {
    static propTypes = {
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        version: PropTypes.string.isRequired,
        downloadUrl: PropTypes.string,
        homepageUrl: PropTypes.string,
        releaseNotesUrl: PropTypes.string,
        iconData: PropTypes.string,
        installedVersion: PropTypes.string.isRequired,
        installing: PropTypes.bool.isRequired,
        error: PropTypes.string,
        actions: PropTypes.shape({
            installPlugin: PropTypes.func.isRequired,
            closeMarketplaceModal: PropTypes.func.isRequired,
        }).isRequired,
    };

    onInstall = () => {
        trackEvent('plugins', 'ui_marketplace_download');
        this.props.actions.installPlugin(this.props.id);
    }

    onUpdate = () => {
        trackEvent('plugins', 'ui_marketplace_download_update');
        this.props.actions.installPlugin(this.props.id);
    }

    onConfigure = () => {
        trackEvent('plugins', 'ui_marketplace_configure');
        this.props.actions.closeMarketplaceModal();
    }

    getItemButton() {
        let actionButton = (
            <FormattedMessage
                id='marketplace_modal.list.Install'
                defaultMessage='Install'
            />
        );
        if (this.props.error) {
            actionButton = (
                <FormattedMessage
                    id='marketplace_modal.list.try_again'
                    defaultMessage='Try Again'
                />
            );
        }

        let button = (
            <button
                onClick={this.onInstall}
                className='btn btn-primary'
                disabled={this.props.installing || this.props.downloadUrl === ''}
            >
                <LoadingWrapper
                    loading={this.props.installing}
                    text={localizeMessage('marketplace_modal.installing', 'Installing...')}
                >
                    {actionButton}
                </LoadingWrapper>

            </button>
        );

        if (this.props.installedVersion !== '' && !this.props.installing && !this.props.error) {
            button = (
                <Link
                    to={'/admin_console/plugins/plugin_' + this.props.id}
                >
                    <button
                        onClick={this.onConfigure}
                        className='btn btn-outline'
                    >
                        <FormattedMessage
                            id='marketplace_modal.list.configure'
                            defaultMessage='Configure'
                        />
                    </button>
                </Link>
            );
        }

        return button;
    }

    render() {
        const ariaLabel = `${this.props.name}, ${this.props.description}`.toLowerCase();
        let versionLabel = `(${this.props.version})`;
        if (this.props.installedVersion !== '') {
            versionLabel = `(${this.props.installedVersion})`;
        }

        let pluginIcon;
        if (this.props.iconData) {
            pluginIcon = (
                <div className='icon__plugin icon__plugin--background'>
                    <img src={this.props.iconData}/>
                </div>
            );
        } else {
            pluginIcon = <PluginIcon className='icon__plugin icon__plugin--background'/>;
        }

        let pluginDetails = (
            <>
                {this.props.name} <span className='light subtitle'>{versionLabel}</span>
                <p className={classNames('more-modal__description', {error_text: this.props.error})}>
                    {this.props.error ? this.props.error : this.props.description}
                </p>
            </>
        );

        if (this.props.homepageUrl) {
            pluginDetails = (
                <a
                    aria-label={ariaLabel}
                    className='style--none more-modal__row--link'
                    target='_blank'
                    rel='noopener noreferrer'
                    href={this.props.homepageUrl}
                >
                    {pluginDetails}
                </a>
            );
        } else {
            pluginDetails = (
                <span
                    aria-label={ariaLabel}
                    className='style--none'
                >
                    {pluginDetails}
                </span>
            );
        }

        return (
            <>
                <div
                    className={classNames('more-modal__row', 'more-modal__row--link', {item_error: this.props.error})}
                    key={this.props.id}
                    id={'marketplace-plugin-' + this.props.id}
                >
                    {pluginIcon}
                    <div className='more-modal__details'>
                        {pluginDetails}
                        <UpdateDetails
                            availableVersion={this.props.version}
                            installedVersion={this.props.installedVersion}
                            releaseNotesUrl={this.props.releaseNotesUrl}
                            isInstalling={this.props.installing}
                            onUpdate={this.onUpdate}
                        />
                    </div>
                    <div className='more-modal__actions'>
                        {this.getItemButton()}
                    </div>
                </div>
            </>
        );
    }
}
