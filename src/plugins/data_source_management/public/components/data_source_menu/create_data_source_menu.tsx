/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DataSourceMenu, DataSourceMenuProps } from './data_source_menu';

export function createDataSourceMenu<T>(props: DataSourceMenuProps<T>) {
  return <DataSourceMenu {...props} />;
}
