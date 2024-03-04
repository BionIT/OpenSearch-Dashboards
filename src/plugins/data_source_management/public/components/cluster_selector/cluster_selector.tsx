/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox } from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { getDataSourcesWithFields } from '../utils';

export const LocalCluster: ClusterOption = {
  label: i18n.translate('dataSource.localCluster', {
    defaultMessage: 'Local cluster',
  }),
  id: '',
};

interface ClusterSelectorProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  onSelectedDataSource: (clusterOption: ClusterOption[]) => void;
  disabled: boolean;
  hideLocalCluster: boolean;
  fullWidth: boolean;
  defaultOption?: ClusterOption[];
  placeholderText?: string;
  removePrepend?: boolean;
  filterFn?: (dataSource: any) => boolean;
}

interface ClusterSelectorState {
  clusterOptions: ClusterOption[];
  selectedOption: ClusterOption[];
}

export interface ClusterOption {
  label: string;
  id: string;
}

export class ClusterSelector extends React.Component<ClusterSelectorProps, ClusterSelectorState> {
  private _isMounted: boolean = false;

  constructor(props: ClusterSelectorProps) {
    super(props);

    this.state = {
      clusterOptions: this.props.hideLocalCluster ? [] : [LocalCluster],
      selectedOption: this.props.hideLocalCluster ? [] : [LocalCluster],
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  async componentDidMount() {
    this._isMounted = true;
    getDataSourcesWithFields(this.props.savedObjectsClient, ['id', 'title', 'auth.type'])
      .then((fetchedDataSources) => {
        if (fetchedDataSources?.length) {
          let filteredDataSources = [];
          if (this.props.filterFn) {
            filteredDataSources = fetchedDataSources.filter((ds) => this.props.filterFn!(ds));
          }

          if (filteredDataSources.length === 0) {
            filteredDataSources = fetchedDataSources;
          }
          const clusterOptions = filteredDataSources.map((dataSource) => ({
            id: dataSource.id,
            label: dataSource.attributes?.title || '',
          }));

          if (!this.props.hideLocalCluster) {
            clusterOptions.unshift(LocalCluster);
          }

          if (!this._isMounted) return;
          this.setState({
            ...this.state,
            clusterOptions,
          });
        }
      })
      .catch(() => {
        this.props.notifications.addWarning(
          i18n.translate('dataSource.fetchDataSourceError', {
            defaultMessage: 'Unable to fetch existing data sources',
          })
        );
      });
  }

  onChange(e) {
    if (!this._isMounted) return;
    this.setState({
      selectedOption: e,
    });
    this.props.onSelectedDataSource(e);
  }

  render() {
    const placeholderText = this.props.placeholderText || 'Select a data source';
    return (
      <EuiComboBox
        aria-label={i18n.translate('clusterSelectorComboBoxAriaLabel', {
          defaultMessage: placeholderText,
        })}
        placeholder={i18n.translate('clusterSelectorComboBoxPlaceholder', {
          defaultMessage: placeholderText,
        })}
        singleSelection={{ asPlainText: true }}
        options={this.state.clusterOptions}
        selectedOptions={this.state.selectedOption}
        onChange={(e) => this.onChange(e)}
        prepend={
          this.props.removePrepend
            ? undefined
            : i18n.translate('clusterSelectorComboBoxPrepend', {
                defaultMessage: 'Data source',
              })
        }
        compressed
        isDisabled={this.props.disabled}
        fullWidth={this.props.fullWidth || false}
        data-test-subj={'clusterSelectorComboBox'}
      />
    );
  }
}
