/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

export { ApplicationService } from './application_service';
export { Capabilities } from './capabilities';
export { ScopedHistory } from './scoped_history';
export {
  App,
  AppMount,
  AppMountDeprecated,
  AppUnmount,
  AppMountContext,
  AppMountParameters,
  AppStatus,
  AppNavLinkStatus,
  AppUpdatableFields,
  AppUpdater,
  ApplicationSetup,
  ApplicationStart,
  AppLeaveHandler,
  AppLeaveActionType,
  AppLeaveAction,
  AppLeaveDefaultAction,
  AppLeaveConfirmAction,
  NavigateToAppOptions,
  PublicAppInfo,
  // Internal types
  InternalApplicationSetup,
  InternalApplicationStart,
  WorkspaceAvailability,
} from './types';
