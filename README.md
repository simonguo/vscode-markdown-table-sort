# [Markdown Table Sort](https://marketplace.visualstudio.com/items?itemName=simonguo.vscode-markdown-table-sort)


Markdown table prettier extension for Visual Studio Code.

## Features

- Support for formatting tables in documents.
- Sort tables by any column (configurable).
- Numeric-aware comparison so numbers sort correctly even when stored as strings.
- Date-aware comparison supporting ISO-style dates (YYYY-MM-DD / YYYY-MM-DD HH:mm:ss).
- Ignore specific characters such as whitespace or prefixes before comparing.
- Optional prettier pass after sorting (disable via `markdownTableSortPrettier.usePrettierFormat`).

![](./resources/preview.gif)

## Usage

The extension automatically formats and sorts markdown tables when you save a `.md` file. You can configure the sort column, order, and other options in your VS Code settings.

## Examples

### String Sorting

**Before:**
```markdown
| name   | email        | age |
| ------ | ------------ | --- |
| zhang  | zhang@a.com  | 25  |
| li     | li@a.com     | 30  |
| wang   | wang@a.com   | 22  |
| amity  | amity@a.com  | 28  |
| batman | batman@a.com | 35  |
```

**After** (sorted by name, column 0, ascending):
```markdown
| name   | email        | age |
| ------ | ------------ | --- |
| amity  | amity@a.com  | 28  |
| batman | batman@a.com | 35  |
| li     | li@a.com     | 30  |
| wang   | wang@a.com   | 22  |
| zhang  | zhang@a.com  | 25  |
```

### Numeric Sorting

**Before:**
```markdown
| name   | score |
| ------ | ----- |
| Alice  | 95    |
| Bob    | 8     |
| Carol  | 120   |
| David  | 42    |
```

**After** (sorted by score, column 1, ascending):
```markdown
| name   | score |
| ------ | ----- |
| Bob    | 8     |
| David  | 42    |
| Alice  | 95    |
| Carol  | 120   |
```

### Date Sorting

**Before:**
```markdown
| event      | date       |
| ---------- | ---------- |
| Meeting    | 2024-03-15 |
| Conference | 2024-01-20 |
| Workshop   | 2024-12-05 |
| Seminar    | 2024-06-10 |
```

**After** (sorted by date, column 1, ascending):
```markdown
| event      | date       |
| ---------- | ---------- |
| Conference | 2024-01-20 |
| Meeting    | 2024-03-15 |
| Seminar    | 2024-06-10 |
| Workshop   | 2024-12-05 |
```

## Configuration

Edit your user or workspace settings to configure the extension.  

```json
// settings.json
{
  "markdownTableSortPrettier.enable": true,
  "markdownTableSortPrettier.sortOrder": "asc",
  "markdownTableSortPrettier.sortColumn": 0,
  "markdownTableSortPrettier.ignoreCharacters": ["~", " "],
  "markdownTableSortPrettier.usePrettierFormat": true
}
```

- `markdownTableSortPrettier.enable` - Enable/disable markdown table sort. (default: `true`)
- `markdownTableSortPrettier.sortOrder` - Sort order, `asc` or `desc`. (default: `asc`)
- `markdownTableSortPrettier.sortColumn` - Sort column, `0` or `1` or `2`... (default: `0`)
- `markdownTableSortPrettier.ignoreCharacters` - Ignore characters. (default: `['~',' ']`)
- `markdownTableSortPrettier.usePrettierFormat` - Run prettier on the table after sorting. (default: `true`)

## Referenced

- https://github.com/prettier/prettier
- https://github.com/TomasHubelbauer/vscode-markdown-table-format
