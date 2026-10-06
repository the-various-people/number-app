export type Cell = string | number | boolean | null | undefined;

/**
 * 표를 CSV 글로 바꾼다. 엑셀에서 한글이 깨지지 않게 맨 앞에 BOM을 붙이고, 줄은 CRLF로 나눈다.
 * 쉼표·따옴표·줄바꿈이 든 칸은 따옴표로 감싼다.
 * 메모처럼 사람이 쓴 글이 =, +, -, @로 시작하면 엑셀이 수식으로 읽지 않게 앞에 '를 붙인다.
 */
export function toCsv(rows: Cell[][]): string {
  return '﻿' + rows.map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

function cell(value: Cell): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'O' : 'X';
  if (typeof value === 'number') return String(value);
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
