import * as assert from 'assert';
import { compareColumnValues, sanitizeColumnValue, sortTableLines } from '../../extension';

suite('extension helpers', () => {
  suite('sanitizeColumnValue', () => {
    test('trims and strips configured characters', () => {
      const result = sanitizeColumnValue(' ~ 123 ~ ', ['~', ' ']);
      assert.strictEqual(result, '123');
    });

    test('returns empty string when value is undefined', () => {
      assert.strictEqual(sanitizeColumnValue(undefined, [' ']), '');
    });

    test('returns original string when no ignore characters are configured', () => {
      assert.strictEqual(sanitizeColumnValue('abc', []), 'abc');
    });

    test('removes all occurrences of ignore characters', () => {
      const result = sanitizeColumnValue('~1~2~3~', ['~']);
      assert.strictEqual(result, '123');
    });
  });

  suite('compareColumnValues', () => {
    test('compares numerically when both values are numbers (asc)', () => {
      const result = compareColumnValues('2', '10', 'asc');
      assert.ok(result < 0);
    });

    test('compares numerically when both values are numbers (desc)', () => {
      const result = compareColumnValues('2', '10', 'desc');
      assert.ok(result > 0);
    });

    test('falls back to locale compare when values are not numeric', () => {
      const result = compareColumnValues('apple', 'banana', 'asc');
      assert.ok(result < 0);
    });

    test('handles equal numeric values', () => {
      const result = compareColumnValues('3', '3', 'asc');
      assert.strictEqual(result, 0);
    });

    test('respects descending order for string comparisons', () => {
      const result = compareColumnValues('apple', 'banana', 'desc');
      assert.ok(result > 0);
    });

    test('compares ISO dates chronologically (asc)', () => {
      const result = compareColumnValues('2023-01-01', '2022-12-31', 'asc');
      assert.ok(result > 0);
    });

    test('compares ISO dates chronologically (desc)', () => {
      const result = compareColumnValues('2023-01-01', '2022-12-31', 'desc');
      assert.ok(result < 0);
    });
  });
});

suite('sortTableLines', () => {
  const numericLines = [
    '| 99503  | 2016-08-09  |',
    '| 978870 | 2022-04-27  |',
    '| 84850  | 2016-08-09  |'
  ];

  const amountLines = [
    '| bravo   | ~10 |',
    '| charlie | ~2  |',
    '| alpha   | ~1  |'
  ];

  const valueLines = [
    '| third  | 3 |',
    '| first  | 1 |',
    '| second | 2 |'
  ];

  test('sorts numeric first column in descending order', () => {
    const sorted = sortTableLines(
      [...numericLines],
      1,
      'desc',
      [],
      true
    );
    const codes = sorted.map(line => line.split('|')[1].trim());
    assert.deepStrictEqual(codes, ['978870', '99503', '84850']);
  });

  test('honors ignoreCharacters when sorting a non-primary column', () => {
    const sorted = sortTableLines(
      [...amountLines],
      2,
      'asc',
      ['~', ' '],
      true
    );
    const names = sorted.map(line => line.split('|')[1].trim());
    assert.deepStrictEqual(names, ['alpha', 'charlie', 'bravo']);
  });

  test('respects enable=false by leaving rows unchanged', () => {
    const sorted = sortTableLines(
      [...valueLines],
      1,
      'asc',
      [],
      false
    );
    assert.deepStrictEqual(sorted, valueLines);
  });

  test('returns original when sortColumn is falsy', () => {
    const sorted = sortTableLines([...valueLines], 0, 'asc', [], true);
    assert.deepStrictEqual(sorted, valueLines);
  });

  test('sorts date column when both values parse as dates', () => {
    const lines = [
      '| entry | 2022-11-05 |',
      '| entry | 2023-01-01 |',
      '| entry | 2021-06-30 |'
    ];

    const sorted = sortTableLines([...lines], 2, 'asc', [], true);
    const dates = sorted.map(line => line.split('|')[2].trim());
    assert.deepStrictEqual(dates, ['2021-06-30', '2022-11-05', '2023-01-01']);
  });
});
