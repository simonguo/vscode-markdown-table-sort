'use strict';
import {
  ExtensionContext,
  TextDocument,
  FormattingOptions,
  CancellationToken,
  TextEdit,
  languages,
  Position,
  DocumentFormattingEditProvider,
  Range,
  workspace
} from 'vscode';

const prettier = require('prettier');

type Table = {
  lines: string[];
  start: Position;
  end?: Position;
};

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sanitizeColumnValue(value: string | undefined, ignoreCharacters: string[]) {
  // Normalizes cell value before comparison to ensure sorting ignores configured characters
  if (!value) {
    return '';
  }

  let sanitized = value;

  ignoreCharacters.forEach(character => {
    if (character) {
      sanitized = sanitized.replace(new RegExp(escapeRegExp(character), 'g'), '');
    }
  });

  return sanitized.trim();
}

export function compareColumnValues(aValue: string, bValue: string, sortOrder: string) {
  // Performs numeric comparison when possible; falls back to locale-aware string compare
  const aNumber = Number(aValue);
  const bNumber = Number(bValue);

  const bothNumeric =
    aValue !== '' && bValue !== '' && !Number.isNaN(aNumber) && !Number.isNaN(bNumber);
  const aDateValue = Date.parse(aValue);
  const bDateValue = Date.parse(bValue);
  const bothDates =
    !bothNumeric &&
    aValue !== '' &&
    bValue !== '' &&
    !Number.isNaN(aDateValue) &&
    !Number.isNaN(bDateValue);

  let comparison: number;

  if (bothNumeric) {
    comparison = aNumber - bNumber;
  } else if (bothDates) {
    comparison = aDateValue - bDateValue;
  } else {
    comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
  }

  return sortOrder === 'asc' ? comparison : -comparison;
}

function getConfig(name: string) {
  const value = workspace.getConfiguration().get(`markdownTableSortPrettier.${name}`);

  return value;
}

export function activate(context: ExtensionContext) {
  const tableFormatter = new TableFormatter();

  languages.registerDocumentFormattingEditProvider('markdown', tableFormatter);
}

class TableFormatter implements DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(
    document: TextDocument,
    _options: FormattingOptions,
    _token: CancellationToken
  ) {
    const edits: TextEdit[] = [];
    const tables: Table[] = [];
    const enable = getConfig('enable');
    const sortOrder = (getConfig('sortOrder') as 'asc' | 'desc') || 'asc';
    const sortColumn = getConfig('sortColumn') ? (getConfig('sortColumn') as number) + 1 : 1;
    const ignoreCharactersConfig = getConfig('ignoreCharacters');
    const ignoreCharacters = Array.isArray(ignoreCharactersConfig) ? ignoreCharactersConfig : [];

    let table = false;
    for (let index = 0; index < document.lineCount; index++) {
      const line = document.lineAt(index);
      if (line.text.startsWith('|')) {
        if (!table) {
          tables.push({ lines: [line.text], start: line.range.start });
          table = true;
        } else {
          tables[tables.length - 1].lines.push(line.text);
        }
      } else {
        if (table) {
          const currentTable = tables[tables.length - 1];
          currentTable.end = line.range.start;
          table = false;
        }
      }
    }

    if (table) {
      const currentTable = tables[tables.length - 1];
      currentTable.end = document.lineAt(document.lineCount - 1).range.end;
    }

    for (const table of tables) {
      const header = [];

      header.push(table.lines.shift());
      header.push(table.lines.shift());

      let markdown = '';
      header.forEach(row => {
        markdown += row + '\n';
      });

      const body = sortTableLines(
        table.lines,
        sortColumn,
        sortOrder,
        ignoreCharacters,
        Boolean(enable)
      );

      body.forEach(row => {
        markdown += row + '\n';
      });

      edits.push(
        TextEdit.replace(
          new Range(table.start, table.end!),
          prettier.format(markdown, {
            parser: document.languageId
          })
        )
      );
    }

    return edits;
  }
}

export function sortTableLines(
  lines: string[],
  sortColumn: number,
  sortOrder: 'asc' | 'desc',
  ignoreCharacters: string[],
  enable: boolean
) {
  if (!enable || !sortColumn) {
    return lines;
  }

  const lineCopy = [...lines];

  return lineCopy.sort((a, b) => {
    const aSplit = a.split('|');
    const bSplit = b.split('|');

    const aColumn = sanitizeColumnValue(aSplit[sortColumn], ignoreCharacters);
    const bColumn = sanitizeColumnValue(bSplit[sortColumn], ignoreCharacters);

    return compareColumnValues(aColumn, bColumn, sortOrder);
  });
}
