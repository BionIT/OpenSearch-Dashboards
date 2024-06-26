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

import {
  DATA_SOURCE_CREDENTIALS_PLACEHOLDER,
  exportSavedObjectsToStream,
} from './get_sorted_objects_for_export';
import { savedObjectsClientMock } from '../service/saved_objects_client.mock';
import { Readable } from 'stream';
import { createPromiseFromStreams, createConcatStream } from '../../utils/streams';
import { createStripPromisesSerializer } from '@osd/dev-utils';

expect.addSnapshotSerializer(createStripPromisesSerializer());

async function readStreamToCompletion(stream: Readable) {
  return createPromiseFromStreams([stream, createConcatStream([])]);
}

describe('getSortedObjectsForExport()', () => {
  const savedObjectsClient = savedObjectsClientMock.create();

  afterEach(() => {
    savedObjectsClient.find.mockReset();
    savedObjectsClient.bulkGet.mockReset();
    savedObjectsClient.create.mockReset();
    savedObjectsClient.bulkCreate.mockReset();
    savedObjectsClient.delete.mockReset();
    savedObjectsClient.get.mockReset();
    savedObjectsClient.update.mockReset();
  });

  test('exports selected types and sorts them', async () => {
    savedObjectsClient.find.mockResolvedValueOnce({
      total: 2,
      saved_objects: [
        {
          id: '2',
          type: 'search',
          attributes: {},
          score: 1,
          references: [
            {
              name: 'name',
              type: 'index-pattern',
              id: '1',
            },
          ],
        },
        {
          id: '1',
          type: 'index-pattern',
          attributes: {},
          score: 1,
          references: [],
        },
      ],
      per_page: 1,
      page: 0,
    });
    const exportStream = await exportSavedObjectsToStream({
      savedObjectsClient,
      exportSizeLimit: 500,
      types: ['index-pattern', 'search'],
    });

    const response = await readStreamToCompletion(exportStream);

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          attributes: Object {},
          id: 1,
          references: Array [],
          type: index-pattern,
        },
        Object {
          attributes: Object {},
          id: 2,
          references: Array [
            Object {
              id: 1,
              name: name,
              type: index-pattern,
            },
          ],
          type: search,
        },
        Object {
          exportedCount: 2,
          missingRefCount: 0,
          missingReferences: Array [],
        },
      ]
    `);
    expect(savedObjectsClient.find).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            Object {
              namespaces: undefined,
              perPage: 500,
              search: undefined,
              type: Array [
                index-pattern,
                search,
              ],
            },
          ],
        ],
        "results": Array [
          Object {
            type: return,
            value: Promise {},
          },
        ],
      }
    `);
  });

  test('omits the `namespaces` property from the export', async () => {
    savedObjectsClient.find.mockResolvedValueOnce({
      total: 2,
      saved_objects: [
        {
          id: '2',
          type: 'search',
          attributes: {},
          namespaces: ['foo', 'bar'],
          score: 0,
          references: [
            {
              name: 'name',
              type: 'index-pattern',
              id: '1',
            },
          ],
        },
        {
          id: '1',
          type: 'index-pattern',
          attributes: {},
          namespaces: ['foo', 'bar'],
          score: 0,
          references: [],
        },
      ],
      per_page: 1,
      page: 0,
    });
    const exportStream = await exportSavedObjectsToStream({
      savedObjectsClient,
      exportSizeLimit: 500,
      types: ['index-pattern', 'search'],
    });

    const response = await readStreamToCompletion(exportStream);

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          attributes: Object {},
          id: 1,
          references: Array [],
          type: index-pattern,
        },
        Object {
          attributes: Object {},
          id: 2,
          references: Array [
            Object {
              id: 1,
              name: name,
              type: index-pattern,
            },
          ],
          type: search,
        },
        Object {
          exportedCount: 2,
          missingRefCount: 0,
          missingReferences: Array [],
        },
      ]
    `);
    expect(savedObjectsClient.find).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            Object {
              namespaces: undefined,
              perPage: 500,
              search: undefined,
              type: Array [
                index-pattern,
                search,
              ],
            },
          ],
        ],
        "results": Array [
          Object {
            type: return,
            value: Promise {},
          },
        ],
      }
    `);
  });

  test('exclude export details if option is specified', async () => {
    savedObjectsClient.find.mockResolvedValueOnce({
      total: 2,
      saved_objects: [
        {
          id: '2',
          type: 'search',
          attributes: {},
          score: 1,
          references: [
            {
              name: 'name',
              type: 'index-pattern',
              id: '1',
            },
          ],
        },
        {
          id: '1',
          type: 'index-pattern',
          attributes: {},
          score: 1,
          references: [],
        },
      ],
      per_page: 1,
      page: 0,
    });
    const exportStream = await exportSavedObjectsToStream({
      savedObjectsClient,
      exportSizeLimit: 500,
      types: ['index-pattern', 'search'],
      excludeExportDetails: true,
    });

    const response = await readStreamToCompletion(exportStream);

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          attributes: Object {},
          id: 1,
          references: Array [],
          type: index-pattern,
        },
        Object {
          attributes: Object {},
          id: 2,
          references: Array [
            Object {
              id: 1,
              name: name,
              type: index-pattern,
            },
          ],
          type: search,
        },
      ]
    `);
  });

  test('exports selected types with search string when present', async () => {
    savedObjectsClient.find.mockResolvedValueOnce({
      total: 2,
      saved_objects: [
        {
          id: '2',
          type: 'search',
          attributes: {},
          score: 1,
          references: [
            {
              name: 'name',
              type: 'index-pattern',
              id: '1',
            },
          ],
        },
        {
          id: '1',
          type: 'index-pattern',
          attributes: {},
          score: 1,
          references: [],
        },
      ],
      per_page: 1,
      page: 0,
    });
    const exportStream = await exportSavedObjectsToStream({
      savedObjectsClient,
      exportSizeLimit: 500,
      types: ['index-pattern', 'search'],
      search: 'foo',
    });

    const response = await readStreamToCompletion(exportStream);

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          attributes: Object {},
          id: 1,
          references: Array [],
          type: index-pattern,
        },
        Object {
          attributes: Object {},
          id: 2,
          references: Array [
            Object {
              id: 1,
              name: name,
              type: index-pattern,
            },
          ],
          type: search,
        },
        Object {
          exportedCount: 2,
          missingRefCount: 0,
          missingReferences: Array [],
        },
      ]
    `);
    expect(savedObjectsClient.find).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            Object {
              namespaces: undefined,
              perPage: 500,
              search: foo,
              type: Array [
                index-pattern,
                search,
              ],
            },
          ],
        ],
        "results": Array [
          Object {
            type: return,
            value: Promise {},
          },
        ],
      }
    `);
  });

  test('exports from the provided namespace when present', async () => {
    savedObjectsClient.find.mockResolvedValueOnce({
      total: 2,
      saved_objects: [
        {
          id: '2',
          type: 'search',
          attributes: {},
          score: 1,
          references: [
            {
              name: 'name',
              type: 'index-pattern',
              id: '1',
            },
          ],
        },
        {
          id: '1',
          type: 'index-pattern',
          attributes: {},
          score: 1,
          references: [],
        },
      ],
      per_page: 1,
      page: 0,
    });
    const exportStream = await exportSavedObjectsToStream({
      savedObjectsClient,
      exportSizeLimit: 500,
      types: ['index-pattern', 'search'],
      namespace: 'foo',
    });

    const response = await readStreamToCompletion(exportStream);

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          attributes: Object {},
          id: 1,
          references: Array [],
          type: index-pattern,
        },
        Object {
          attributes: Object {},
          id: 2,
          references: Array [
            Object {
              id: 1,
              name: name,
              type: index-pattern,
            },
          ],
          type: search,
        },
        Object {
          exportedCount: 2,
          missingRefCount: 0,
          missingReferences: Array [],
        },
      ]
    `);
    expect(savedObjectsClient.find).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            Object {
              namespaces: Array [
                foo,
              ],
              perPage: 500,
              search: undefined,
              type: Array [
                index-pattern,
                search,
              ],
            },
          ],
        ],
        "results": Array [
          Object {
            type: return,
            value: Promise {},
          },
        ],
      }
    `);
  });

  test('export selected types throws error when exceeding exportSizeLimit', async () => {
    savedObjectsClient.find.mockResolvedValueOnce({
      total: 2,
      saved_objects: [
        {
          id: '2',
          type: 'search',
          attributes: {},
          score: 1,
          references: [
            {
              type: 'index-pattern',
              name: 'name',
              id: '1',
            },
          ],
        },
        {
          id: '1',
          type: 'index-pattern',
          attributes: {},
          score: 1,
          references: [],
        },
      ],
      per_page: 1,
      page: 0,
    });
    await expect(
      exportSavedObjectsToStream({
        savedObjectsClient,
        exportSizeLimit: 1,
        types: ['index-pattern', 'search'],
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`Can't export more than 1 objects`);
  });

  test('sorts objects within type', async () => {
    savedObjectsClient.find.mockResolvedValueOnce({
      total: 3,
      per_page: 10000,
      page: 1,
      saved_objects: [
        {
          id: '3',
          type: 'index-pattern',
          attributes: {
            name: 'baz',
          },
          score: 1,
          references: [],
        },
        {
          id: '1',
          type: 'index-pattern',
          attributes: {
            name: 'foo',
          },
          score: 1,
          references: [],
        },
        {
          id: '2',
          type: 'index-pattern',
          attributes: {
            name: 'bar',
          },
          score: 1,
          references: [],
        },
      ],
    });
    const exportStream = await exportSavedObjectsToStream({
      exportSizeLimit: 10000,
      savedObjectsClient,
      types: ['index-pattern'],
    });
    const response = await readStreamToCompletion(exportStream);
    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          attributes: Object {
            name: foo,
          },
          id: 1,
          references: Array [],
          type: index-pattern,
        },
        Object {
          attributes: Object {
            name: bar,
          },
          id: 2,
          references: Array [],
          type: index-pattern,
        },
        Object {
          attributes: Object {
            name: baz,
          },
          id: 3,
          references: Array [],
          type: index-pattern,
        },
        Object {
          exportedCount: 3,
          missingRefCount: 0,
          missingReferences: Array [],
        },
      ]
    `);
  });

  test('exports selected objects and sorts them', async () => {
    savedObjectsClient.bulkGet.mockResolvedValueOnce({
      saved_objects: [
        {
          id: '2',
          type: 'search',
          attributes: {},
          references: [
            {
              id: '1',
              name: 'name',
              type: 'index-pattern',
            },
          ],
        },
        {
          id: '1',
          type: 'index-pattern',
          attributes: {},
          references: [],
        },
      ],
    });
    const exportStream = await exportSavedObjectsToStream({
      exportSizeLimit: 10000,
      savedObjectsClient,
      objects: [
        {
          type: 'index-pattern',
          id: '1',
        },
        {
          type: 'search',
          id: '2',
        },
      ],
    });
    const response = await readStreamToCompletion(exportStream);
    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          attributes: Object {},
          id: 1,
          references: Array [],
          type: index-pattern,
        },
        Object {
          attributes: Object {},
          id: 2,
          references: Array [
            Object {
              id: 1,
              name: name,
              type: index-pattern,
            },
          ],
          type: search,
        },
        Object {
          exportedCount: 2,
          missingRefCount: 0,
          missingReferences: Array [],
        },
      ]
    `);
    expect(savedObjectsClient.bulkGet).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            Array [
              Object {
                id: 1,
                type: index-pattern,
              },
              Object {
                id: 2,
                type: search,
              },
            ],
            Object {
              namespace: undefined,
            },
          ],
        ],
        "results": Array [
          Object {
            type: return,
            value: Promise {},
          },
        ],
      }
    `);
  });

  test('modifies return results to redact `namespaces` attribute', async () => {
    const createSavedObject = (obj: any) => ({ ...obj, attributes: {}, references: [] });
    savedObjectsClient.bulkGet.mockResolvedValueOnce({
      saved_objects: [
        createSavedObject({ type: 'multi', id: '1', namespaces: ['foo'] }),
        createSavedObject({ type: 'multi', id: '2', namespaces: ['bar'] }),
        createSavedObject({ type: 'other', id: '3' }),
      ],
    });
    const exportStream = await exportSavedObjectsToStream({
      exportSizeLimit: 10000,
      savedObjectsClient,
      objects: [
        { type: 'multi', id: '1' },
        { type: 'multi', id: '2' },
        { type: 'other', id: '3' },
      ],
    });
    const response = await readStreamToCompletion(exportStream);
    expect(response).toEqual([
      createSavedObject({ type: 'multi', id: '1' }),
      createSavedObject({ type: 'multi', id: '2' }),
      createSavedObject({ type: 'other', id: '3' }),
      expect.objectContaining({ exportedCount: 3 }),
    ]);
  });

  test('modifies return results to update `credentials` of data-source to use placeholder', async () => {
    const createDataSourceSavedObject = (id: string, auth: any) => ({
      id,
      type: 'data-source',
      attributes: { auth },
      references: [],
    });

    const dataSourceNoAuthInfo = { type: 'no_auth' };
    const dataSourceBasicAuthInfo = {
      type: 'username_password',
      credentials: { username: 'foo', password: 'bar' },
    };

    const redactedDataSourceBasicAuthInfo = {
      type: 'username_password',
      credentials: {
        username: DATA_SOURCE_CREDENTIALS_PLACEHOLDER,
        password: DATA_SOURCE_CREDENTIALS_PLACEHOLDER,
      },
    };

    savedObjectsClient.bulkGet.mockResolvedValueOnce({
      saved_objects: [
        createDataSourceSavedObject('1', dataSourceNoAuthInfo),
        createDataSourceSavedObject('2', dataSourceBasicAuthInfo),
      ],
    });
    const exportStream = await exportSavedObjectsToStream({
      exportSizeLimit: 10000,
      savedObjectsClient,
      objects: [
        { type: 'data-source', id: '1' },
        { type: 'data-source', id: '2' },
      ],
    });
    const response = await readStreamToCompletion(exportStream);
    expect(response).toEqual([
      createDataSourceSavedObject('1', dataSourceNoAuthInfo),
      createDataSourceSavedObject('2', redactedDataSourceBasicAuthInfo),
      expect.objectContaining({ exportedCount: 2 }),
    ]);
  });

  test('includes nested dependencies when passed in', async () => {
    savedObjectsClient.bulkGet.mockResolvedValueOnce({
      saved_objects: [
        {
          id: '2',
          type: 'search',
          attributes: {},
          references: [
            {
              type: 'index-pattern',
              name: 'name',
              id: '1',
            },
          ],
        },
      ],
    });
    savedObjectsClient.bulkGet.mockResolvedValueOnce({
      saved_objects: [
        {
          id: '1',
          type: 'index-pattern',
          attributes: {},
          references: [],
        },
      ],
    });
    const exportStream = await exportSavedObjectsToStream({
      exportSizeLimit: 10000,
      savedObjectsClient,
      objects: [
        {
          type: 'search',
          id: '2',
        },
      ],
      includeReferencesDeep: true,
    });
    const response = await readStreamToCompletion(exportStream);
    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          attributes: Object {},
          id: 1,
          references: Array [],
          type: index-pattern,
        },
        Object {
          attributes: Object {},
          id: 2,
          references: Array [
            Object {
              id: 1,
              name: name,
              type: index-pattern,
            },
          ],
          type: search,
        },
        Object {
          exportedCount: 2,
          missingRefCount: 0,
          missingReferences: Array [],
        },
      ]
    `);
    expect(savedObjectsClient.bulkGet).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            Array [
              Object {
                id: 2,
                type: search,
              },
            ],
            Object {
              namespace: undefined,
            },
          ],
          Array [
            Array [
              Object {
                id: 1,
                type: index-pattern,
              },
            ],
            Object {
              namespace: undefined,
            },
          ],
        ],
        "results": Array [
          Object {
            type: return,
            value: Promise {},
          },
          Object {
            type: return,
            value: Promise {},
          },
        ],
      }
    `);
  });

  test('exports selected objects when passed workspaces', async () => {
    savedObjectsClient.bulkGet.mockResolvedValueOnce({
      saved_objects: [
        {
          id: '2',
          type: 'search',
          attributes: {},
          references: [
            {
              id: '1',
              name: 'name',
              type: 'index-pattern',
            },
          ],
        },
        {
          id: '1',
          type: 'index-pattern',
          attributes: {},
          references: [],
        },
      ],
    });
    await exportSavedObjectsToStream({
      exportSizeLimit: 10000,
      savedObjectsClient,
      objects: [
        {
          type: 'index-pattern',
          id: '1',
        },
        {
          type: 'search',
          id: '2',
        },
      ],
      workspaces: ['foo'],
    });
    expect(savedObjectsClient.bulkGet).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            Array [
              Object {
                id: 1,
                type: index-pattern,
              },
              Object {
                id: 2,
                type: search,
              },
            ],
            Object {
              namespace: undefined,
            },
          ],
        ],
        "results": Array [
          Object {
            type: return,
            value: Promise {},
          },
        ],
      }
    `);
  });

  test('export selected objects throws error when exceeding exportSizeLimit', async () => {
    const exportOpts = {
      exportSizeLimit: 1,
      savedObjectsClient,
      objects: [
        {
          type: 'index-pattern',
          id: '1',
        },
        {
          type: 'search',
          id: '2',
        },
      ],
    };
    await expect(exportSavedObjectsToStream(exportOpts)).rejects.toThrowErrorMatchingInlineSnapshot(
      `Can't export more than 1 objects`
    );
  });

  test('rejects when neither type nor objects paramaters are passed in', () => {
    const exportOpts = {
      exportSizeLimit: 1,
      savedObjectsClient,
      types: undefined,
      objects: undefined,
    };

    expect(exportSavedObjectsToStream(exportOpts)).rejects.toThrowErrorMatchingInlineSnapshot(
      `Either \`type\` or \`objects\` are required.`
    );
  });

  test('rejects when both objects and search are passed in', () => {
    const exportOpts = {
      exportSizeLimit: 1,
      savedObjectsClient,
      objects: [{ type: 'index-pattern', id: '1' }],
      search: 'foo',
    };

    expect(exportSavedObjectsToStream(exportOpts)).rejects.toThrowErrorMatchingInlineSnapshot(
      `Can't specify both "search" and "objects" properties when exporting`
    );
  });
});
