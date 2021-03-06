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
  Range
} from 'vscode';

const prettier = require('prettier');

type Table = {
  lines: string[];
  start: Position;
  end?: Position;
};

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

      const body = table.lines.sort();
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
