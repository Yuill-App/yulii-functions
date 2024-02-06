import { GoogleSpreadsheet, GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet } from "google-spreadsheet";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyDTevOYw83A5DlpDhIFywI4vq4sqsLO4GI";
const GOOGLE_SHEET_DOC_ID = process.env.GOOGLE_SHEET_DOC_ID || "1HyEQZTmPP2CFmGxcRpY_w-0C8aznIl8dvcGQ_LtZC5Y" ;
const GOOGLE_SHEET_SHEET_ID = parseInt(process.env.GOOGLE_SHEET_SHEET_ID || "208276878", 10);

let rows: GoogleSpreadsheetRow[] | null = null;
let sheet: GoogleSpreadsheetWorksheet | null = null;

const googleSheetDoc = new GoogleSpreadsheet(GOOGLE_SHEET_DOC_ID);
googleSheetDoc.useApiKey(GOOGLE_API_KEY);

export interface FormatOptions {
  key: string;
  value: string;
}

export const getRows = async () => {
  if(rows !== null && rows.length > 0) {
    return rows;
  }
  if(sheet === null) {
    await googleSheetDoc.loadInfo();
    sheet = googleSheetDoc.sheetsById[GOOGLE_SHEET_SHEET_ID];
  }
  rows = await sheet.getRows();

  return rows;
}

export const getRowByKey = async (key: string): Promise<GoogleSpreadsheetRow | undefined> => {
  const _rows = await getRows();

  return _rows.find(row => row.Key === key);
}

export const getCellValue = async (rowKey: string, columnKey: "fr" | "en", options?: FormatOptions) => {
  const row = await getRowByKey(rowKey);

  if(row) {
    const value = row[columnKey] as string;

    if(options) {
      return value.replace(options.key, options.value);
    }

    return value;
  }

  return undefined;
}

// getCellValue("notifications.claimedReward.body", "fr", { key: "{{user}}", value: "Dan" }).then(console.log).catch(console.error);


