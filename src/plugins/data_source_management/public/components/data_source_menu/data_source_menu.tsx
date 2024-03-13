/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactElement } from 'react';
import { EuiHeaderLinks } from '@elastic/eui';
import classNames from 'classnames';

import {
  MountPoint,
  NotificationsStart,
  SavedObjectsClientContract,
} from '../../../../../core/public';
import { MountPointPortal } from '../../../../opensearch_dashboards_react/public';
import { DataSourceSelectable } from './data_source_selectable';
import { DataSourceOption } from '../data_source_selector/data_source_selector';
import { DataSourceAggregatedView } from '../data_source_aggregated_view';
import { DataSourceView } from '../data_source_view';
import { FilterItem } from '../data_source_multi_selectable/data_source_multi_selectable';
import { DataSourceMultiSelectable } from '../data_source_multi_selectable/data_source_multi_selectable';
import { TopNavMenuData, TopNavMenuItem } from '../../../../../../src/plugins/navigation/public';

export interface DataSourceMenuProps {
  showDataSourceSelectable?: boolean;
  showDataSourceView?: boolean;
  showDataSourceAggregatedView?: boolean;
  activeDatasourceIds?: string[];
  showDataSourceMultiSelectable?: boolean;
  appName: string;
  savedObjects?: SavedObjectsClientContract;
  notifications?: NotificationsStart;
  fullWidth: boolean;
  hideLocalCluster?: boolean;
  dataSourceCallBackFunc?: (dataSource: DataSourceOption) => void;
  // TODO: combine with dataSourceCallBackFunc
  selectedDataSourcesCallBackFunc?: (dataSources: DataSourceOption[] | FilterItem[]) => void;
  disableDataSourceSelectable?: boolean;
  className?: string;
  selectedOption?: DataSourceOption[];
  setMenuMountPoint?: (menuMount: MountPoint | undefined) => void;
  filterFn?: (dataSource: any) => boolean;
  displayAllCompatibleDataSources?: boolean;
  dataSourceOptions?: DataSourceOption[];
  config?: TopNavMenuData[];
  showTopNavMenuItems?: boolean;
}

export function DataSourceMenu(props: DataSourceMenuProps): ReactElement | null {
  const {
    savedObjects,
    notifications,
    dataSourceCallBackFunc,
    showDataSourceSelectable,
    disableDataSourceSelectable,
    showDataSourceAggregatedView,
    fullWidth,
    hideLocalCluster,
    selectedOption,
    showDataSourceView,
    showDataSourceMultiSelectable,
    selectedDataSourcesCallBackFunc,
    filterFn,
    activeDatasourceIds,
    displayAllCompatibleDataSources,
    dataSourceOptions,
    showTopNavMenuItems,
  } = props;

  if (
    !showDataSourceSelectable &&
    !showDataSourceView &&
    !showDataSourceAggregatedView &&
    !showDataSourceMultiSelectable &&
    !showTopNavMenuItems
  ) {
    return null;
  }

  function renderDataSourceView(className: string, config?: TopNavMenuData[]): ReactElement | null {
    if (!showDataSourceView) return null;
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" className={className}>
        {config && config.length > 0 && renderItems(config)}
        <DataSourceView
          fullWidth={fullWidth}
          selectedOption={selectedOption && selectedOption.length > 0 ? selectedOption : undefined}
        />
      </EuiHeaderLinks>
    );
  }

  function renderItems(config: TopNavMenuData[]): ReactElement[] | null {
    if (!config || config.length === 0) return null;
    return config.map((menuItem: TopNavMenuData, i: number) => {
      return <TopNavMenuItem key={`nav-menu-${i}`} {...menuItem} />;
    });
  }

  function renderDataSourceMultiSelectable(
    className: string,
    config?: TopNavMenuData[]
  ): ReactElement | null {
    if (!showDataSourceMultiSelectable) return null;
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" className={className}>
        {config && config.length > 0 && renderItems(config)}
        <DataSourceMultiSelectable
          fullWidth={fullWidth}
          hideLocalCluster={hideLocalCluster || false}
          savedObjectsClient={savedObjects!}
          notifications={notifications!.toasts}
          onSelectedDataSources={selectedDataSourcesCallBackFunc!}
        />
      </EuiHeaderLinks>
    );
  }

  function renderDataSourceSelectable(
    className: string,
    config?: TopNavMenuData[]
  ): ReactElement | null {
    if (!showDataSourceSelectable) return null;
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" className={className}>
        {config && config.length > 0 && renderItems(config)}
        <DataSourceSelectable
          fullWidth={fullWidth}
          hideLocalCluster={hideLocalCluster || false}
          savedObjectsClient={savedObjects!}
          notifications={notifications!.toasts}
          onSelectedDataSource={dataSourceCallBackFunc!}
          disabled={disableDataSourceSelectable || false}
          selectedOption={selectedOption && selectedOption.length > 0 ? selectedOption : undefined}
          filterFn={filterFn}
          dataSourceOptions={dataSourceOptions}
        />
      </EuiHeaderLinks>
    );
  }

  function renderDataSourceAggregatedView(
    className: string,
    config?: TopNavMenuData[]
  ): ReactElement | null {
    if (!showDataSourceAggregatedView) return null;
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" className={className}>
        {config && config.length > 0 && renderItems(config)}
        <DataSourceAggregatedView
          fullWidth={fullWidth}
          hideLocalCluster={hideLocalCluster || false}
          savedObjectsClient={savedObjects!}
          notifications={notifications!.toasts}
          activeDatasourceIds={activeDatasourceIds}
          filterFn={filterFn}
          displayAllCompatibleDataSources={displayAllCompatibleDataSources || false}
        />
      </EuiHeaderLinks>
    );
  }

  function renderLayout() {
    const { setMenuMountPoint, config } = props;
    const menuClassName = classNames('osdTopNavMenu', props.className);
    if (setMenuMountPoint) {
      return (
        <>
          <MountPointPortal setMountPoint={setMenuMountPoint}>
            {renderDataSourceAggregatedView(menuClassName, config)}
            {renderDataSourceSelectable(menuClassName, config)}
            {renderDataSourceView(menuClassName, config)}
            {renderDataSourceMultiSelectable(menuClassName, config)}
          </MountPointPortal>
        </>
      );
    } else {
      return (
        <>
          {renderDataSourceSelectable(menuClassName)}
          {renderDataSourceView(menuClassName)}
        </>
      );
    }
  }

  return renderLayout();
}

DataSourceMenu.defaultProps = {
  disableDataSourceSelectable: false,
  showDataSourceAggregatedView: false,
  showDataSourceSelectable: false,
  displayAllCompatibleDataSources: false,
  showDataSourceView: false,
  hideLocalCluster: false,
  showDataSourceMultiSelectable: false,
  showTopNavMenuItems: false,
};
