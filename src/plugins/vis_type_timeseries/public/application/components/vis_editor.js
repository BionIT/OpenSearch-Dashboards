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

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import * as Rx from 'rxjs';
import { share } from 'rxjs/operators';
import { isEqual, isEmpty, debounce } from 'lodash';
import { VisEditorVisualization } from './vis_editor_visualization';
import { Visualization } from './visualization';
import { VisPicker } from './vis_picker';
import { PanelConfig } from './panel_config';
import { createBrushHandler } from '../lib/create_brush_handler';
import { fetchFields } from '../lib/fetch_fields';
import { extractIndexPatterns } from '../../../../../plugins/vis_type_timeseries/common/extract_index_patterns';
import { getSavedObjectsClient, getUISettings, getDataStart, getCoreStart } from '../../services';
import { DATA_SOURCE_ID_KEY } from '../../../common/constants';

import { CoreStartContextProvider } from '../contexts/query_input_bar_context';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import { Storage } from '../../../../../plugins/opensearch_dashboards_utils/public';

const VIS_STATE_DEBOUNCE_DELAY = 200;
const APP_NAME = 'VisEditor';

export class VisEditor extends Component {
  constructor(props) {
    super(props);
    this.localStorage = new Storage(window.localStorage);
    this.state = {
      model: props.visParams,
      dirty: false,
      autoApply: true,
      visFields: props.visFields,
      extractedIndexPatterns: [''],
    };
    this.onBrush = createBrushHandler((data) => props.vis.API.events.applyFilter(data));
    this.visDataSubject = new Rx.BehaviorSubject(this.props.visData);
    this.visData$ = this.visDataSubject.asObservable().pipe(share());

    // In new_platform, this context should be populated with
    // core dependencies required by React components downstream.
    this.coreContext = {
      appName: APP_NAME,
      uiSettings: getUISettings(),
      savedObjectsClient: getSavedObjectsClient(),
      store: this.localStorage,
    };
  }

  get uiState() {
    return this.props.vis.uiState;
  }

  getConfig = (...args) => {
    return this.props.config.get(...args);
  };

  handleUiState = (field, value) => {
    this.props.vis.uiState.set(field, value);
    // reload visualization because data might need to be re-fetched
    this.props.vis.uiState.emit('reload');
  };

  updateVisState = debounce(() => {
    this.props.vis.params = this.state.model;
    this.props.embeddableHandler.reload();
    this.props.eventEmitter.emit('dirtyStateChange', {
      isDirty: false,
    });
  }, VIS_STATE_DEBOUNCE_DELAY);

  handleChange = (partialModel) => {
    if (isEmpty(partialModel)) {
      return;
    }
    const hasTypeChanged = partialModel.type && this.state.model.type !== partialModel.type;
    const nextModel = {
      ...this.state.model,
      ...partialModel,
    };
    let dirty = true;
    if (this.state.autoApply || hasTypeChanged) {
      this.updateVisState();

      dirty = false;
    }

    if (this.props.isEditorMode) {
      const dataSourceId = nextModel[DATA_SOURCE_ID_KEY] || undefined;
      const extractedIndexPatterns = extractIndexPatterns(nextModel);
      if (
        !isEqual(this.state.extractedIndexPatterns, extractedIndexPatterns) ||
        !isEqual(this.state.model[DATA_SOURCE_ID_KEY], dataSourceId)
      ) {
        fetchFields(extractedIndexPatterns, dataSourceId).then((visFields) =>
          this.setState({
            visFields,
            extractedIndexPatterns,
          })
        );
      }
    }

    this.setState({
      dirty,
      model: nextModel,
    });
  };

  updateModel = () => {
    const { params } = this.props.vis.clone();

    this.setState({
      model: params,
    });
  };

  handleCommit = () => {
    this.updateVisState();
    this.setState({ dirty: false });
  };

  handleAutoApplyToggle = (event) => {
    this.setState({ autoApply: event.target.checked });
  };

  onDataChange = ({ visData }) => {
    this.visDataSubject.next(visData);
  };

  render() {
    if (!this.props.isEditorMode) {
      if (!this.props.visParams || !this.props.visData) {
        return null;
      }
      return (
        <Visualization
          dateFormat={this.props.config.get('dateFormat')}
          onBrush={this.onBrush}
          onUiState={this.handleUiState}
          uiState={this.uiState}
          model={this.props.visParams}
          visData={this.props.visData}
          getConfig={this.getConfig}
        />
      );
    }

    const { model } = this.state;

    if (model) {
      //TODO: Remove CoreStartContextProvider, OpenSearchDashboardsContextProvider should be raised to the top of the plugin.
      return (
        <OpenSearchDashboardsContextProvider
          services={{
            appName: APP_NAME,
            storage: this.localStorage,
            data: getDataStart(),
            ...getCoreStart(),
          }}
        >
          <div className="tvbEditor" data-test-subj="tvbVisEditor">
            <div className="tvbEditor--hideForReporting">
              <VisPicker model={model} onChange={this.handleChange} />
            </div>
            <VisEditorVisualization
              dirty={this.state.dirty}
              autoApply={this.state.autoApply}
              model={model}
              embeddableHandler={this.props.embeddableHandler}
              eventEmitter={this.props.eventEmitter}
              vis={this.props.vis}
              timeRange={this.props.timeRange}
              uiState={this.uiState}
              onCommit={this.handleCommit}
              onToggleAutoApply={this.handleAutoApplyToggle}
              title={this.props.vis.title}
              description={this.props.vis.description}
              onDataChange={this.onDataChange}
            />
            <div className="tvbEditor--hideForReporting">
              <CoreStartContextProvider value={this.coreContext}>
                <PanelConfig
                  fields={this.state.visFields}
                  model={model}
                  visData$={this.visData$}
                  dateFormat={this.props.config.get('dateFormat')}
                  onChange={this.handleChange}
                  getConfig={this.getConfig}
                />
              </CoreStartContextProvider>
            </div>
          </div>
        </OpenSearchDashboardsContextProvider>
      );
    }

    return null;
  }

  componentDidMount() {
    this.props.renderComplete();

    if (this.props.isEditorMode && this.props.eventEmitter) {
      this.props.eventEmitter.on('updateEditor', this.updateModel);
    }
  }

  componentDidUpdate() {
    this.props.renderComplete();
  }

  componentWillUnmount() {
    this.updateVisState.cancel();

    if (this.props.isEditorMode && this.props.eventEmitter) {
      this.props.eventEmitter.off('updateEditor', this.updateModel);
    }
  }
}

VisEditor.defaultProps = {
  visData: {},
};

VisEditor.propTypes = {
  vis: PropTypes.object,
  visData: PropTypes.object,
  visFields: PropTypes.object,
  renderComplete: PropTypes.func,
  config: PropTypes.object,
  isEditorMode: PropTypes.bool,
  savedObj: PropTypes.object,
  timeRange: PropTypes.object,
  appState: PropTypes.object,
};

// default export required for React.Lazy
// eslint-disable-next-line import/no-default-export
export { VisEditor as default };
