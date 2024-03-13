/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FilterChecked } from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { i18n } from '@osd/i18n';
import { DataSourceOption } from '../data_source_selector/data_source_selector';
import { FilterGroup } from './filter_group';
import { getDataSourcesWithFields } from '../utils';

export interface FilterItem {
  name: string | React.ReactNode;
  id: string;
  visible: boolean;
  childOptionIds?: Set<string>;
  checked?: FilterChecked;
}

export interface DataSourceMultiSeletableProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  onSelectedDataSources: (dataSources: DataSourceOption[] | FilterItem[]) => void;
  hideLocalCluster: boolean;
  fullWidth: boolean;
}

interface DataSourceMultiSeletableState {
  dataSourceOptions: DataSourceOption[] | FilterItem[];
  selectedOptions: DataSourceOption[] | FilterItem[];
}

export class DataSourceMultiSelectable extends React.Component<
  DataSourceMultiSeletableProps,
  DataSourceMultiSeletableState
> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceMultiSeletableProps) {
    super(props);

    this.state = {
      dataSourceOptions: [],
      selectedOptions: [],
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
          const selectedOptions: FilterItem[] = fetchedDataSources.map((dataSource) => ({
            id: dataSource.id,
            name: dataSource.attributes?.title || '',
            checked: 'on',
            visible: true,
          }));

          if (!this.props.hideLocalCluster) {
            selectedOptions.unshift({
              id: '',
              name: 'Local cluster',
              checked: 'on',
              visible: true,
            });
          }

          if (!this._isMounted) return;
          this.setState({
            ...this.state,
            selectedOptions,
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

  onChange(items: FilterItem[]) {
    if (!this._isMounted) return;
    this.setState({
      selectedOptions: items,
    });
    this.props.onSelectedDataSources(items);
  }

  render() {
    return (
      <FilterGroup
        items={this.state.selectedOptions as FilterItem[]}
        hasGroupOptions={false}
        setItems={this.onChange.bind(this)}
      />
    );
  }
}
