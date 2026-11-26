# DigiMan Frontend

서울에 사는 일본인이 무료 공공행사를 찾고 같이 갈 사람을 만나는 모바일 웹 앱의 프론트엔드입니다. UI는 일본어 기준입니다.

## 스택

React 19 · Vite 8 · TypeScript · React Router · TanStack Query · Zustand · Tailwind CSS 4 · MapLibre GL JS + OpenFreeMap (@vis.gl/react-maplibre) · MSW · oxlint · Prettier

## 시작하기

Node 24 LTS(`.nvmrc`)와 npm을 씁니다.

```bash
npm install
cp .env.example .env.local
npm run dev
```

http://localhost:5173 에서 열립니다. `VITE_USE_MOCK=true`면 API 응답은 `src/mocks`의 mock 데이터입니다.

## 환경변수

| 이름                | 설명                                              |
| ------------------- | ------------------------------------------------- |
| `VITE_API_BASE_URL` | API 기본 경로. 기본 `/api`                        |
| `VITE_USE_MOCK`     | `true`면 MSW mock 사용                            |
| `API_PROXY_TARGET`  | 개발 서버가 `/api`를 넘길 백엔드 주소 (개발 전용) |

`VITE_`로 시작하는 값은 빌드 결과에 그대로 들어갑니다. 비밀 값은 넣지 않습니다.

지도 타일은 OpenFreeMap을 쓰므로 키가 필요 없습니다. 지도 오른쪽 아래 출처 표시(OpenFreeMap, OpenMapTiles, OpenStreetMap)는 약관상 지우지 않습니다.

## 스크립트

| 명령              | 설명                                        |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | 개발 서버                                   |
| `npm run build`   | 타입 검사 + 프로덕션 빌드 (`dist/`)         |
| `npm run preview` | 빌드 결과 미리보기                          |
| `npm run check`   | lint + 포맷 검사 + 타입 검사 (PR 전에 실행) |
| `npm run format`  | Prettier로 포맷                             |

## 폴더

```
src/
  app/        라우터, Provider, 공통 레이아웃
  pages/      라우트 단위 화면
  features/   기능별 컴포넌트와 API 훅
  shared/     공통 (api, ui, i18n, lib, types, stores)
  mocks/      MSW 핸들러와 mock 데이터
  styles/     Tailwind와 디자인 토큰
```

## 배포

프론트는 Vercel에 배포합니다. `/api`는 Vercel rewrites로 백엔드에 넘깁니다. 자세한 내용은 [docs/deploy.md](docs/deploy.md)를 봅니다.

작업 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)를 봅니다.
