/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import React from 'react';
import { FilterGroup } from './filter_group';

describe('FilterGroup', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  it('should render normally', () => {
    const setItems = jest.fn();
    component = shallow(
      <FilterGroup
        items={[{ id: '1', name: 'name1', checked: 'on', visible: true }]}
        setItems={(items) => setItems(items)}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
