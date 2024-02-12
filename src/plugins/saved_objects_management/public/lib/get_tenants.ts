/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart, SavedObjectsImportError } from 'opensearch-dashboards/public';

interface GetTenantsFromRemoteResponse {
  objects: string;
  errors?: SavedObjectsImportError[];
}
export async function getTenantsFromRemote(
  http: HttpStart,
  selectedDataSourceId: string,
  dataSourceEnabled: boolean
) {
  const body = JSON.stringify({ dataSourceId: selectedDataSourceId });
  return await http.post<GetTenantsFromRemoteResponse>('/internal/data-source-management/tenants', {
    body,
    headers: {
      // Important to be undefined, it forces proper headers to be set for FormData
      'Content-Type': 'application/json',
    },
  });
}
