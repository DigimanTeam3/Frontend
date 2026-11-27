# Front 배포 (상세)

결정과 이유는 Notion 「Front 배포 ADR (Vercel)」에 있고, 설정·절차·체크리스트는 이 문서에 둡니다.

결정: **front는 Vercel, 백엔드는 EC2.** 브라우저는 Vercel 주소만 부르고, `/api/*`는 Vercel rewrites가 EC2 백엔드로 넘깁니다 (CORS 불필요).

## 1. 배포 방식 — 필요할 때만 수동 배포 (Vercel CLI)

- 운영 주소: https://digiman-frontend.vercel.app (Vercel 프로젝트 `digiman-frontend`)
- 레포 `DigimanTeam3/Frontend`는 GitHub 조직 소유라 Vercel 무료(Hobby) 계정에 연결할 수 없습니다 (https://vercel.com/docs/limits). 그래서 레포를 연결하지 않고 Vercel CLI로 배포합니다 (비용 없음).
- **main에 머지해도 자동으로 배포되지 않습니다.** 프론트 팀장(안재현)이 필요할 때 main 기준으로 배포합니다. 배포가 필요하면 Slack으로 요청합니다.
- 배포 명령 (최신 main만 받은 깨끗한 폴더에서 실행):

```bash
npx vercel@latest deploy --prod --yes --build-env VITE_USE_MOCK=true --build-env VITE_API_BASE_URL=/api
```

- 백엔드를 연결한 뒤에는 `VITE_USE_MOCK=false`로 바꿉니다.

### 처음 한 번 설정

1. `npx vercel@latest login`으로 Vercel 계정에 로그인
2. `npx vercel@latest link --yes --project digiman-frontend`로 프로젝트 연결 (`.vercel/`은 커밋하지 않음)

## 2. vercel.json

레포 루트의 `vercel.json`은 지금 화면 새로고침용 한 줄만 있습니다. 백엔드 주소가 정해지면 `/api` 줄을 **맨 앞에** 추가합니다 (rewrites는 위에서부터 맞는 것 하나만 적용).

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://<백엔드 주소>/:path*" },
    { "source": "/((?!assets/|api/).*)", "destination": "/index.html" }
  ]
}
```

- `/api` 줄: `/api`를 떼고 백엔드로 넘깁니다. 백엔드 라우트가 `/api/...`로 시작하면 `destination`을 `https://<백엔드 주소>/api/:path*`로 바꿉니다.
- 새로고침 줄: 화면 새로고침 시 `index.html`로 (Vite SPA 공식 안내, https://vercel.com/docs/frameworks/frontend/vite). 실제 파일(`/assets/...`)은 rewrites보다 먼저 응답됩니다. `/assets/`·`/api/` 아래 없는 주소는 `index.html`로 보내지 않고 404로 둡니다.
- 외부 대상은 최대 120초까지 기다리고, 넘으면 `ROUTER_EXTERNAL_TARGET_ERROR` (https://vercel.com/docs/limits).
- 문서 예시는 https 대상뿐입니다. 백엔드가 http만 열려 있으면 동작하는지 먼저 확인합니다.

## 3. 환경변수

배포 명령의 `--build-env`로 넘깁니다 (Vercel 프로젝트 설정에는 두지 않음).

| 변수                | 백엔드 연결 전 | 연결 후 | 설명            |
| ------------------- | -------------- | ------- | --------------- |
| `VITE_API_BASE_URL` | `/api`         | `/api`  | rewrites로 넘김 |
| `VITE_USE_MOCK`     | `true`         | `false` | MSW mock        |

- `VITE_` 값은 번들에 들어갑니다. 비밀 값은 넣지 않습니다. `API_PROXY_TARGET`은 로컬 개발 전용입니다.

## 4. 빌드 설정

- Framework: Vite (자동 인식), Build: `npm run build`, Output: `dist`, Node 24.
- 무료 한도: 월 전송 100GB, 하루 배포 100회, 동시 빌드 1개, 빌드 1회 최대 45분.

## 5. LINE 로그인

- 콜백 URL은 고정된 운영 주소(`https://<프로젝트>.vercel.app/...` 또는 연결한 도메인)로 등록합니다.
- 미리보기 주소는 배포마다 바뀌므로 로그인 테스트는 운영 주소에서 합니다.

## 6. 11/27 첫 배포 체크리스트

- [x] Vercel 프로젝트 생성, 첫 배포 (11/27, mock 모드)
- [x] `vercel.json` 반영, 운영 주소에서 새로고침 404 없는지 (`/map`, `/events/1`)
- [x] 지도(OpenFreeMap)·3D 건물·출처 표시
- [ ] 백엔드 주소(HTTPS) 확인 → `/api` rewrite 추가, `/api` 호출이 백엔드까지 가는지
- [ ] 사진 업로드가 rewrites를 거쳐 백엔드까지 가는지
- [ ] 실기기 3종(iOS Safari, Android Chrome, LINE 앱 안)에서 위치 권한·좌표·하단 탭 바·3D 지도 속도
- [ ] LINE 로그인 채널에 운영 주소 콜백 등록

## 7. 11/29 당일

- 마지막 배포는 프리즈 전에 여유를 둡니다. 문제가 생기면 Vercel 대시보드 Deployments에서 이전 배포를 Promote해 되돌립니다. 배포는 1장의 명령으로 합니다.
- 지도 타일(OpenFreeMap)은 서비스 보장이 없습니다. 당일 아침 운영 주소에서 확인합니다.
- 행사장 Wi-Fi가 느리면 폰 데이터로 데모합니다.
