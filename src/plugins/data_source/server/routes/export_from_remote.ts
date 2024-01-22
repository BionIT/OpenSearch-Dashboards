/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createDataSourceError } from '../lib/error';
import { CryptographyServiceSetup } from '../cryptography_service';
import { getAWSCredential } from '../client/configure_client_utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('https');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const aws4 = require('aws4');

export class DataSourceConnector {
  constructor(
    private readonly cryptography: CryptographyServiceSetup,
    private readonly dataSourceAttr: any
  ) {}

  async getAllowedTypes() {
    try {
      const cred = await getAWSCredential(this.dataSourceAttr, this.cryptography!);
      const { accessKey, secretKey, region, service } = cred;
      const urlObject = new URL(this.dataSourceAttr.endpoint);

      const options = {
        method: 'GET',
        hostname: urlObject.hostname,
        path: '/_dashboards/api/opensearch-dashboards/management/saved_objects/_allowed_types',
        headers: {
          'Content-Type': 'application/json',
        },
        service,
        region,
        maxRedirects: 20,
      };

      const signedRequest = aws4.sign(options, {
        secretAccessKey: secretKey,
        accessKeyId: accessKey,
      });

      return new Promise((resolve, reject) => {
        const req = https.request(signedRequest, function (res) {
          const chunks = [];

          res.on('data', function (chunk) {
            chunks.push(chunk);
          });

          res.on('end', function (chunk) {
            const body = Buffer.concat(chunks);
            const obj = JSON.parse(body.toString());
            resolve(obj.types);
          });

          res.on('error', function (error) {
            console.error(error);
          });
        });
        req.end();
      });
    } catch (e) {
      throw createDataSourceError(e);
    }
  }

  async exportSavedObjects(types: string[]) {
    try {
      const cred = await getAWSCredential(this.dataSourceAttr, this.cryptography!);
      const { accessKey, secretKey, region, service } = cred;
      const urlObject = new URL(this.dataSourceAttr.endpoint);

      const concatTypes = types.map((item) => `type=${item}`);
      const options = {
        method: 'GET',
        hostname: urlObject.hostname,
        path: `/_dashboards/api/saved_objects/_find?${concatTypes.join('&')}&per_page=10000`,
        headers: {
          'Content-Type': 'application/json',
        },
        service,
        region,
        maxRedirects: 20,
      };

      const signedRequest = aws4.sign(options, {
        secretAccessKey: secretKey,
        accessKeyId: accessKey,
      });

      return new Promise((resolve, reject) => {
        const req = https.request(signedRequest, function (res) {
          const chunks = [];

          res.on('data', function (chunk) {
            chunks.push(chunk);
          });

          res.on('end', function (chunk) {
            const body = Buffer.concat(chunks);
            const resp = JSON.parse(body.toString());
            console.log(resp)
            resolve(resp.saved_objects);
          });

          res.on('error', function (error) {
            console.error(error);
          });
        });
        req.end();
      });
    } catch (e) {
      throw createDataSourceError(e);
    }
  }
}
