/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiComboBox,
  EuiIcon,
  EuiPopover,
  EuiContextMenuPanel,
  EuiHorizontalRule,
  EuiPanel,
  EuiButtonEmpty,
  EuiSelectable,
  EuiContextMenuItem,
  EuiTitle,
  EuiSpacer,
} from '@elastic/eui';
import { SavedObjectsClientContract, ToastsStart } from 'opensearch-dashboards/public';
import { getDataSources } from '../utils';

export const LocalCluster: ClusterOption = {
  label: i18n.translate('dataSource.localCluster', {
    defaultMessage: 'Local cluster',
  }),
  id: '',
};

interface DataSourcePickerProps {
  savedObjectsClient: SavedObjectsClientContract;
  notifications: ToastsStart;
  onSelectedDataSource: (clusterOption: ClusterOption[]) => void;
  disabled: boolean;
  hideLocalCluster: boolean;
  fullWidth: boolean;
}

interface DataSourcePickerState {
  clusterOptions: ClusterOption[];
  selectedOption: ClusterOption[];
}

export interface ClusterOption {
  label: string;
  id: string;
}

export class DataSourcePicker extends React.Component<
  DataSourcePickerProps,
  DataSourcePickerState
> {
  private _isMounted: boolean = false;

  constructor(props: DataSourcePickerProps) {
    super(props);

    this.state = {
      isPopoverOpen: false,
      clusterOptions: this.props.hideLocalCluster ? [] : [LocalCluster],
      selectedOption: this.props.hideLocalCluster ? [] : [LocalCluster],
    };

    this.onSelectedDataSource.bind(this);
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  onClick() {
    this.setState({ ...this.state, isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ ...this.state, isPopoverOpen: false });
  }

  async componentDidMount() {
    this._isMounted = true;
    getDataSources(this.props.savedObjectsClient)
      .then((fetchedDataSources) => {
        if (fetchedDataSources?.length) {
          const clusterOptions = fetchedDataSources.map((dataSource) => ({
            id: dataSource.id,
            label: dataSource.title,
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

  onSelectedDataSource(options) {
    const selectedDataSource = options.find(({ checked }) => checked);
    this.setState({ selectedOption: [selectedDataSource] });
  }

  render() {
    const button = (
      <EuiButtonEmpty
        className="euiHeaderLink"
        onClick={this.onClick.bind(this)}
        data-test-subj="toggleContextMenu"
        aria-label={i18n.translate('console.requestOptionsButtonAriaLabel', {
          defaultMessage: 'some cluster',
        })}
        iconType="database"
        size="s"
      >
        {/* <EuiIcon type="database" /> */}
        {(this.state.selectedOption &&
          this.state.selectedOption.length > 0 &&
          this.state.selectedOption[0].label) ||
          ''}
      </EuiButtonEmpty>
    );

    return (
      <EuiPopover
        id={'contextMenu'}
        button={button}
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover.bind(this)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
      >
        <EuiContextMenuPanel>
          <EuiPanel color="transparent" paddingSize="s">
            <EuiSpacer size="s" />
            <EuiSelectable
              aria-label="Search"
              searchable
              searchProps={{
                compressed: true,
                placeholder: 'Search',
              }}
              options={this.state.clusterOptions}
              onChange={(newOptions) => this.onSelectedDataSource(newOptions)}
              singleSelection={true}
            >
              {(list, search) => (
                <>
                  {search}
                  {list}
                </>
              )}
            </EuiSelectable>
          </EuiPanel>
        </EuiContextMenuPanel>
      </EuiPopover>
    );
  }
}
