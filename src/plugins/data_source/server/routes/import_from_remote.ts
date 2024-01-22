/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import stringify from 'json-stable-stringify';
import { DataSourceServiceSetup } from '../data_source_service';
import { CryptographyServiceSetup } from '../cryptography_service';
import { DataSourceConnector } from './export_from_remote';

export const registerImportFromRemoteRoute = (
  router: IRouter,
  dataSourceServiceSetup: DataSourceServiceSetup,
  cryptography: CryptographyServiceSetup
) => {
  router.post(
    {
      path: '/internal/data-source-management/migrate',
      validate: {
        body: schema.object({
          dataSourceId: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const { dataSourceId } = request.body;
      // get datasource from saved object service
      const dataSourceAttr = await context.core.savedObjects.client
        .get('data-source', dataSourceId)
        .then((response) => {
          const attributes: any = response?.attributes || {};
          return attributes;
        });

      const connector = new DataSourceConnector(cryptography, dataSourceAttr);

      const types = await connector.getAllowedTypes();
      const objs = await connector.exportSavedObjects(types);
      // @ts-ignore
      const res = objs.map((item) => stringify(item));
      const data = res.join('\n');

      return response.ok({
        body: {
          success: true,
          objects: data,
        },
      });
    }
  );
};
