/**
 * 웹: 브라우저가 CSV 파일을 내려받게 한다 (태블릿에서는 "파일" 앱이나 다운로드 폴더에 저장된다).
 * 태블릿 앱에서는 Metro가 save.native.ts를 대신 고른다.
 */
export async function saveTextFile(fileName: string, text: string): Promise<'saved' | 'shared'> {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'saved';
}
