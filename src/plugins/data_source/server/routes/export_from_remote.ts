/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Buffer } from 'buffer';
import { createDataSourceError } from '../lib/error';
import { CryptographyServiceSetup } from '../cryptography_service';
import { getAWSCredential, getCredential } from '../client/configure_client_utils';
import { AuthType } from '../../common/data_sources';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('https');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const aws4 = require('aws4');

export class DataSourceConnector {
  constructor(
    private readonly cryptography: CryptographyServiceSetup,
    private readonly dataSourceAttr: any
  ) {}

  async getTenants() {
    try {
      const urlObject = new URL(this.dataSourceAttr.endpoint);

      if (this.dataSourceAttr.auth.type === AuthType.UsernamePasswordType) {
        const { username, password } = await getCredential(this.dataSourceAttr, this.cryptography);
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        const loginresp = await fetch(`https://${urlObject.hostname}/_dashboards/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ username, password }),
          headers: {
            'Content-Type': 'application/json',
            'osd-xsrf': 'true',
            credentials: 'include',
          },
        });
        const cookie = loginresp.headers.get('set-cookie');

        const resp = await fetch(
          `https://${urlObject.hostname}/_dashboards/api/v1/configuration/tenants`,
          {
            method: 'GET',
            headers: {
              Authorization: `Basic ${encoded}`,
              'Content-Type': 'application/json',
              Cookie: `${cookie}`,
              'osd-xsrf': 'true',
            },
          }
        );
        const respJson = await resp.json();
        return respJson.data;
      } else if (this.dataSourceAttr.auth.type === AuthType.SigV4) {
        const cred = await getAWSCredential(this.dataSourceAttr, this.cryptography!);
        const { accessKey, secretKey, region, service } = cred;
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
              // console.error(error);
            });
          });
          req.end();
        });
      }
    } catch (e) {
      throw createDataSourceError(e);
    }
  }

  async getAllowedTypes(tenant: string) {
    try {
      const urlObject = new URL(this.dataSourceAttr.endpoint);

      if (this.dataSourceAttr.auth.type === AuthType.UsernamePasswordType) {
        const { username, password } = await getCredential(this.dataSourceAttr, this.cryptography);
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        const loginresp = await fetch(`https://${urlObject.hostname}/_dashboards/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ username, password }),
          headers: {
            'Content-Type': 'application/json',
            'osd-xsrf': 'true',
            credentials: 'include',
          },
        });
        const cookie = loginresp.headers.get('set-cookie');

        const changetenantresp = await fetch(
          `https://${urlObject.hostname}/_dashboards/api/v1/multitenancy/tenant`,
          {
            method: 'POST',
            body: JSON.stringify({ tenant, username }),
            headers: {
              Authorization: `Basic ${encoded}`,
              'Content-Type': 'application/json',
              Cookie: `${cookie}`,
              'osd-xsrf': 'true',
            },
          }
        );

        const newcookie = changetenantresp.headers.get('set-cookie');

        const resp = await fetch(
          `https://${urlObject.hostname}/_dashboards/api/opensearch-dashboards/management/saved_objects/_allowed_types`,
          {
            method: 'GET',
            headers: {
              Authorization: `Basic ${encoded}`,
              'Content-Type': 'application/json',
              Cookie: `${newcookie}`,
              'osd-xsrf': 'true',
            },
          }
        );
        const respJson = await resp.json();
        return respJson.types;
      } else if (this.dataSourceAttr.auth.type === AuthType.SigV4) {
        const cred = await getAWSCredential(this.dataSourceAttr, this.cryptography!);
        const { accessKey, secretKey, region, service } = cred;
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
              // console.error(error);
            });
          });
          req.end();
        });
      }
    } catch (e) {
      throw createDataSourceError(e);
    }
  }

  async exportSavedObjects(types: string[], tenant: string) {
    const concatTypes = types.map((item) => `type=${item}`);
    const urlObject = new URL(this.dataSourceAttr.endpoint);

    try {
      if (this.dataSourceAttr.auth.type === AuthType.UsernamePasswordType) {
        const { username, password } = await getCredential(this.dataSourceAttr, this.cryptography);
        const encoded = Buffer.from(`${username}:${password}`).toString('base64');
        const loginresp = await fetch(`https://${urlObject.hostname}/_dashboards/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ username, password }),
          headers: {
            'Content-Type': 'application/json',
            'osd-xsrf': 'true',
            credentials: 'include',
          },
        });
        const cookie = loginresp.headers.get('set-cookie');

        const changetenantresp = await fetch(
          `https://${urlObject.hostname}/_dashboards/api/v1/multitenancy/tenant`,
          {
            method: 'POST',
            body: JSON.stringify({ tenant, username }),
            headers: {
              Authorization: `Basic ${encoded}`,
              'Content-Type': 'application/json',
              Cookie: `${cookie}`,
              'osd-xsrf': 'true',
            },
          }
        );

        const newcookie = changetenantresp.headers.get('set-cookie');

        const resp = await fetch(
          `https://${urlObject.hostname}/_dashboards/api/saved_objects/_find?${concatTypes.join(
            '&'
          )}&per_page=10000`,
          {
            method: 'GET',
            headers: {
              Authorization: `Basic ${encoded}`,
              'Content-Type': 'application/json',
              Cookie: `${newcookie}`,
              'osd-xsrf': 'true',
            },
          }
        );

        const respJson = await resp.json();
        return respJson.saved_objects;
      } else if (this.dataSourceAttr.auth.type === AuthType.SigV4) {
        const cred = await getAWSCredential(this.dataSourceAttr, this.cryptography!);
        const { accessKey, secretKey, region, service } = cred;
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
              resolve(resp.saved_objects);
            });

            res.on('error', function (error) {
              // console.error(error);
            });
          });
          req.end();
        });
      }
    } catch (e) {
      throw createDataSourceError(e);
    }
  }
}
