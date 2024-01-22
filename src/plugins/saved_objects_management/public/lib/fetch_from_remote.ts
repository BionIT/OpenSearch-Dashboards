
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */


import { HttpStart, SavedObjectsImportError } from 'opensearch-dashboards/public';

interface FetchFromRemoteResponse {
  objects: string;
  errors?: SavedObjectsImportError[];
}
export async function fetchFromRemote(
  http: HttpStart,
  selectedDataSourceId: string,
  dataSourceEnabled: boolean
) {
  const body = JSON.stringify({ dataSourceId: selectedDataSourceId });
  return await http.post<FetchFromRemoteResponse>('/internal/data-source-management/migrate', {
    body,
    headers: {
      // Important to be undefined, it forces proper headers to be set for FormData
      'Content-Type': 'application/json',
    },
  });
}
