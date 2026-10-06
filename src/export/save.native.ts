import { Share } from 'react-native';

/**
 * 태블릿 앱(Expo Go): 공유 창을 열어 메일·메신저·드라이브로 보낸다.
 * 기본 공유 창은 글로만 보낼 수 있어서, 파일로 저장하려면 받은 쪽에서 .csv로 저장한다.
 * 앱을 정식으로 빌드할 때 expo-file-system + expo-sharing으로 파일 그대로 보내게 바꾼다.
 */
export async function saveTextFile(fileName: string, text: string): Promise<'saved' | 'shared'> {
  await Share.share({ title: fileName, message: text });
  return 'shared';
}
