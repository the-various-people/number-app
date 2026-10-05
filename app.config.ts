import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * app.json을 그대로 쓰고, 웹 배포 때만 주소 앞부분(baseUrl)을 붙인다.
 * GitHub Pages는 https://<계정>.github.io/<저장소 이름>/ 아래에서 열리므로
 * 배포 작업(.github/workflows/deploy-web.yml)이 BASE_URL=/<저장소 이름> 을 넘겨준다.
 * 개발 중(Expo Go, 로컬 웹)에는 BASE_URL이 없어서 영향이 없다.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: {
    ...config.experiments,
    ...(process.env.BASE_URL ? { baseUrl: process.env.BASE_URL } : {}),
  },
});
