import { getSheetsClient } from '../config/google';

export interface SheetData {
  range: string;
  values: string[][];
}

export async function readSpreadsheet(
  spreadsheetId: string,
  range: string,
  accessToken?: string
): Promise<SheetData> {
  const sheets = getSheetsClient(accessToken);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return {
    range: response.data.range ?? range,
    values: (response.data.values ?? []) as string[][],
  };
}

export async function writeToSpreadsheet(
  _spreadsheetId: string,
  _range: string,
  _values: string[][],
  _accessToken?: string
): Promise<void> {
  throw new Error('Not implemented');
}

export async function extractSprintDataFromSheet(
  spreadsheetId: string,
  accessToken?: string
): Promise<Record<string, unknown>[]> {
  const data = await readSpreadsheet(spreadsheetId, 'A1:Z1000', accessToken);

  if (!data.values || data.values.length < 2) {
    return [];
  }

  const [headers, ...rows] = data.values;
  return rows.map((row) =>
    headers.reduce(
      (obj, header, index) => {
        obj[header] = row[index] ?? '';
        return obj;
      },
      {} as Record<string, unknown>
    )
  );
}
