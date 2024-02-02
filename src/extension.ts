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
    const sortOrder = getConfig('sortOrder') || 'asc';
    const sortColumn = getConfig('sortColumn') ? (getConfig('sortColumn') as number) + 1 : 1;
    const ignoreCharacters = (getConfig('ignoreCharacters') as string[]) || [];

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

      let body = table.lines;

      if (enable) {
        body = table.lines.sort((a, b) => {
          const aSplit = a.split('|');
          const bSplit = b.split('|');

          if (sortColumn) {
            let aColumn = aSplit[sortColumn];
            let bColumn = bSplit[sortColumn];

            if (ignoreCharacters) {
              ignoreCharacters.forEach(character => {
                aColumn = aColumn.replace(character, '');
                bColumn = bColumn.replace(character, '');
              });
            }

            if (sortOrder === 'asc') {
              return aColumn.localeCompare(bColumn);
            } else {
              return bColumn.localeCompare(aColumn);
            }
          }

          return 0;
        });
      }

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
