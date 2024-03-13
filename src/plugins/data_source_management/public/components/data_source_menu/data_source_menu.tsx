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
import { DataSourceView } from '../data_source_view';
import { FilterItem } from '../data_source_multi_selectable/data_source_multi_selectable';
import { DataSourceMultiSelector } from '../data_source_multi_selectable/data_source_multi_selectable';

export interface DataSourceMenuProps {
  showDataSourceSelectable?: boolean;
  showDataSourceView?: boolean;
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
}

export function DataSourceMenu(props: DataSourceMenuProps): ReactElement | null {
  const {
    savedObjects,
    notifications,
    dataSourceCallBackFunc,
    showDataSourceSelectable,
    disableDataSourceSelectable,
    fullWidth,
    hideLocalCluster,
    selectedOption,
    showDataSourceView,
    showDataSourceMultiSelectable,
    selectedDataSourcesCallBackFunc,
    filterFn,
  } = props;

  if (!showDataSourceSelectable && !showDataSourceView && !showDataSourceMultiSelectable) {
    return null;
  }

  function renderDataSourceView(className: string): ReactElement | null {
    if (!showDataSourceView) return null;
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" className={className}>
        <DataSourceView
          fullWidth={fullWidth}
          selectedOption={selectedOption && selectedOption.length > 0 ? selectedOption : undefined}
        />
      </EuiHeaderLinks>
    );
  }

  function renderDataSourceMultiSelectable(className: string): ReactElement | null {
    if (!showDataSourceMultiSelectable) return null;
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" className={className}>
        <DataSourceMultiSelector
          fullWidth={fullWidth}
          hideLocalCluster={hideLocalCluster || false}
          savedObjectsClient={savedObjects!}
          notifications={notifications!.toasts}
          onSelectedDataSources={selectedDataSourcesCallBackFunc!}
        />
      </EuiHeaderLinks>
    );
  }

  function renderDataSourceSelectable(className: string): ReactElement | null {
    if (!showDataSourceSelectable) return null;
    return (
      <EuiHeaderLinks data-test-subj="top-nav" gutterSize="xs" className={className}>
        <DataSourceSelectable
          fullWidth={fullWidth}
          hideLocalCluster={hideLocalCluster || false}
          savedObjectsClient={savedObjects!}
          notifications={notifications!.toasts}
          onSelectedDataSource={dataSourceCallBackFunc!}
          disabled={disableDataSourceSelectable || false}
          selectedOption={selectedOption && selectedOption.length > 0 ? selectedOption : undefined}
          filterFn={filterFn}
        />
      </EuiHeaderLinks>
    );
  }

  function renderLayout() {
    const { setMenuMountPoint } = props;
    const menuClassName = classNames('osdTopNavMenu', props.className);
    if (setMenuMountPoint) {
      return (
        <>
          <MountPointPortal setMountPoint={setMenuMountPoint}>
            {renderDataSourceSelectable(menuClassName)}
            {renderDataSourceView(menuClassName)}
            {renderDataSourceMultiSelectable(menuClassName)}
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
  showDataSourceView: false,
  showDataSourceSelectable: false,
  showDataSourceMultiSelectable: false,
};
