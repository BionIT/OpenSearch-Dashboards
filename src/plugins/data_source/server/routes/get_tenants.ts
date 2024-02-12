/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { DataSourceServiceSetup } from '../data_source_service';
import { CryptographyServiceSetup } from '../cryptography_service';
import { DataSourceConnector } from './export_from_remote';

export const registerGetTenantsFromRemoteRoute = (
  router: IRouter,
  dataSourceServiceSetup: DataSourceServiceSetup,
  cryptography: CryptographyServiceSetup
) => {
  router.post(
    {
      path: '/internal/data-source-management/tenants',
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
        .then((resp) => {
          const attributes: any = resp?.attributes || {};
          return attributes;
        });

      const connector = new DataSourceConnector(cryptography, dataSourceAttr);

      const tenants = await connector.getTenants();
      // @ts-ignore
      const data = Object.keys(tenants);

      return response.ok({
        body: {
          success: true,
          objects: data,
        },
      });
    }
  );
};
