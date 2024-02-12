/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiComboBox } from '@elastic/eui';
import { ToastsStart } from 'opensearch-dashboards/public';

interface TenantSelectorProps {
  notifications: ToastsStart;
  onSelectedTenant: (clusterOption: TenantOption[]) => void;
  disabled: boolean;
  fullWidth: boolean;
}

interface TenantSelectorState {
  selectedOption: TenantOption[];
}

export interface TenantOption {
  label: string;
  id: string;
}

export class TenantSelector extends React.Component<TenantSelectorProps, TenantSelectorState> {
  constructor(props: TenantSelectorProps) {
    super(props);

    this.state = {
      selectedOption: [],
    };
  }

  onChange(e) {
    this.setState({
      selectedOption: e,
    });
    this.props.onSelectedTenant(e);
  }

  render() {
    return (
      <EuiComboBox
        aria-label={i18n.translate('tenantSelectorComboBoxAriaLabel', {
          defaultMessage: 'Select a tenant',
        })}
        placeholder={i18n.translate('tenantSelectorComboBoxPlaceholder', {
          defaultMessage: 'Select a tenant',
        })}
        singleSelection={{ asPlainText: true }}
        options={this.props.tenantOptions.map((option) => ({
          id: option,
          label: option,
        }))}
        selectedOptions={this.state.selectedOption}
        onChange={(e) => this.onChange(e)}
        prepend={i18n.translate('tenantSelectorComboBoxPrepend', {
          defaultMessage: 'Tenant',
        })}
        compressed
        isDisabled={this.props.disabled}
        fullWidth={this.props.fullWidth || false}
        data-test-subj={'tenantSelectorComboBox'}
      />
    );
  }
}
