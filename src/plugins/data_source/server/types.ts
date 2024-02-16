/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LegacyCallAPIOptions,
  OpenSearchClient,
  SavedObjectsClientContract,
  OpenSearchDashboardsRequest,
} from 'src/core/server';
import {
  DataSourceAttributes,
  AuthType,
  UsernamePasswordTypedContent,
  SigV4Content,
} from '../common/data_sources';

import { CryptographyServiceSetup } from './cryptography_service';
import { DataSourceError } from './lib/error';
import { IAuthenticationMethodRegistery } from './auth_registry';
import { CustomApiSchemaRegistry } from './schema_register';

export interface LegacyClientCallAPIParams {
  endpoint: string;
  clientParams?: Record<string, any>;
  options?: LegacyCallAPIOptions;
}

export interface DataSourceClientParams {
  // to fetch data source on behalf of users, caller should pass scoped saved objects client
  savedObjects: SavedObjectsClientContract;
  cryptography: CryptographyServiceSetup;
  // optional when creating test client, required for normal client
  dataSourceId?: string;
  // required when creating test client
  testClientDataSourceAttr?: DataSourceAttributes;
  // custom API schema registry 
  customApiSchemaRegistryPromise: Promise<CustomApiSchemaRegistry>;
}

export interface DataSourceCredentialsProviderOptions {
  dataSourceAttr: DataSourceAttributes;
  request?: OpenSearchDashboardsRequest;
  cryptography?: CryptographyServiceSetup;
}

export type DataSourceCredentialsProvider = (
  options: DataSourceCredentialsProviderOptions
) => Promise<UsernamePasswordTypedContent | SigV4Content>;

export interface AuthenticationMethod {
  name: string;
  authType: AuthType;
  credentialProvider: DataSourceCredentialsProvider;
}

export interface DataSourcePluginRequestContext {
  opensearch: {
    getClient: (dataSourceId: string) => Promise<OpenSearchClient>;
    legacy: {
      getClient: (
        dataSourceId: string
      ) => {
        callAPI: (
          endpoint: string,
          clientParams: Record<string, any>,
          options?: LegacyCallAPIOptions
        ) => Promise<unknown>;
      };
    };
  };
}
declare module 'src/core/server' {
  interface RequestHandlerContext {
    dataSource: DataSourcePluginRequestContext;
  }
}

export interface DataSourcePluginSetup {
  createDataSourceError: (err: any) => DataSourceError;
  registerCredentialProvider: (method: AuthenticationMethod) => void;
  registerCustomApiSchema: (schema: any) => void;
}

export interface DataSourcePluginStart {
  getAuthenticationMethodRegistery: () => IAuthenticationMethodRegistery;
  getCustomApiSchemaRegistry: () => CustomApiSchemaRegistry;
}
