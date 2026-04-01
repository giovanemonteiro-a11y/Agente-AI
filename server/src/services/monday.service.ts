import { logger } from '../utils/logger';

const MONDAY_API_URL = 'https://api.monday.com/v2';

export interface MondayItem {
  id: string;
  name: string;
  state: string;
  column_values: Array<{ id: string; text: string; value: string }>;
  created_at: string;
  updated_at: string;
}

export interface MondayBoard {
  id: string;
  name: string;
  items: MondayItem[];
}

// ── Internal GraphQL helper ───────────────────────────────────────────────────

async function mondayQuery(
  gqlQuery: string,
  variables?: Record<string, unknown>
): Promise<unknown> {
  const apiToken = process.env.MONDAY_API_TOKEN;
  if (!apiToken) {
    throw new Error('MONDAY_API_TOKEN not configured');
  }

  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiToken,
      'API-Version': '2023-10',
    },
    body: JSON.stringify({ query: gqlQuery, variables }),
  });

  if (!response.ok) {
    throw new Error(`Monday.com API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as { data?: unknown; errors?: unknown[] };

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Monday.com GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

function mockItems(): MondayItem[] {
  return [
    {
      id: 'mock-001',
      name: 'Mock Task — Monday.com not configured',
      state: 'active',
      column_values: [
        { id: 'status', text: 'Em andamento', value: '{"index":1}' },
        { id: 'person', text: '', value: '{}' },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch all items from a Monday.com board.
 * Returns mock data if MONDAY_API_TOKEN is not set.
 */
export async function getBoardItems(boardId: string): Promise<MondayItem[]> {
  if (!process.env.MONDAY_API_TOKEN) {
    logger.warn('MONDAY_API_TOKEN not configured — returning mock board items');
    return mockItems();
  }

  try {
    const data = (await mondayQuery(
      `query($boardId: ID!) {
        boards(ids: [$boardId]) {
          items_page(limit: 100) {
            items {
              id
              name
              state
              created_at
              updated_at
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }`,
      { boardId }
    )) as {
      boards: Array<{
        items_page: { items: MondayItem[] };
      }>;
    };

    return data.boards?.[0]?.items_page?.items ?? [];
  } catch (err) {
    logger.error('getBoardItems failed:', err);
    return mockItems();
  }
}

/**
 * Create a new item on a Monday.com board.
 * Returns mock id if MONDAY_API_TOKEN is not set.
 */
export async function createItem(
  boardId: string,
  groupId: string,
  itemName: string,
  columnValues: Record<string, string> = {}
): Promise<{ id: string }> {
  if (!process.env.MONDAY_API_TOKEN) {
    logger.warn('MONDAY_API_TOKEN not configured — returning mock created item id');
    return { id: `mock-${Date.now()}` };
  }

  try {
    const data = (await mondayQuery(
      `mutation($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
        create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues) {
          id
        }
      }`,
      {
        boardId,
        groupId,
        itemName,
        columnValues: JSON.stringify(columnValues),
      }
    )) as { create_item: { id: string } };

    return { id: data.create_item.id };
  } catch (err) {
    logger.error('createItem failed:', err);
    return { id: `mock-${Date.now()}` };
  }
}

/**
 * Update column values on an existing Monday.com item.
 * No-ops if MONDAY_API_TOKEN is not set.
 */
export async function updateItem(
  boardId: string,
  itemId: string,
  columnValues: Record<string, string>
): Promise<void> {
  if (!process.env.MONDAY_API_TOKEN) {
    logger.warn('MONDAY_API_TOKEN not configured — skipping updateItem');
    return;
  }

  try {
    await mondayQuery(
      `mutation($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
          id
        }
      }`,
      {
        boardId,
        itemId,
        columnValues: JSON.stringify(columnValues),
      }
    );
  } catch (err) {
    logger.error('updateItem failed:', err);
  }
}

/**
 * Update a single column value on an existing Monday.com item.
 * No-ops if MONDAY_API_TOKEN is not set.
 */
export async function updateItemColumn(
  itemId: string,
  boardId: string,
  columnId: string,
  value: string
): Promise<void> {
  if (!process.env.MONDAY_API_TOKEN) {
    logger.warn('MONDAY_API_TOKEN not configured — skipping updateItemColumn');
    return;
  }

  try {
    await mondayQuery(
      `mutation($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) {
          id
        }
      }`,
      { boardId, itemId, columnId, value }
    );
  } catch (err) {
    logger.error('updateItemColumn failed:', err);
  }
}

export { mondayQuery };
