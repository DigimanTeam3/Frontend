# Front 배포 (상세)

결정과 이유는 Notion 「Front 배포 ADR (Vercel)」에 있고, 설정·절차·체크리스트는 이 문서에 둡니다.

결정: **front는 Vercel, 백엔드는 EC2.** 브라우저는 Vercel 주소만 부르고, `/api/*`는 Vercel rewrites가 EC2 백엔드로 넘깁니다 (CORS 불필요).

## 1. 배포 방식 — GitHub Actions + Vercel CLI

- 레포 `DigimanTeam3/Frontend`는 GitHub 조직 소유라 Vercel 무료(Hobby) 계정에 연결할 수 없습니다 (https://vercel.com/docs/limits). 그래서 레포를 연결하지 않고 GitHub Actions에서 Vercel CLI로 배포합니다 (비용 없음).
- 워크플로: `.github/workflows/deploy.yml`
  - `main`에 push(머지) → 운영 배포 (`vercel deploy --prebuilt --prod`)
  - PR 열기·수정 → 미리보기 배포, 주소를 PR 댓글로 남김 (포크에서 온 PR은 secret이 없어 건너뜀)
- 방식은 Vercel 공식 가이드를 따릅니다: https://vercel.com/guides/how-can-i-use-github-actions-with-vercel

### 처음 한 번 설정

1. Vercel 계정에서 토큰 만들기 (Account Settings → Tokens) → `VERCEL_TOKEN`
2. 로컬에서 `npx vercel link`로 프로젝트를 만들고, 생긴 `.vercel/project.json`의 `orgId`, `projectId` 확인 → `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (`.vercel/`은 커밋하지 않음)
3. 레포 Settings → Secrets and variables → Actions에 위 3개 등록 (레포 admin)
4. Vercel 프로젝트 설정에서 환경변수(3장) 등록
5. 무료 계정에서 CLI 배포가 되는지 첫 배포로 확인. 안 되면 로컬에서 `vercel --prod`로 배포

## 2. vercel.json

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://<백엔드 주소>/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- 첫 줄: `/api`를 떼고 백엔드로 넘깁니다. 백엔드 라우트가 `/api/...`로 시작하면 `destination`을 `https://<백엔드 주소>/api/:path*`로 바꿉니다.
- 둘째 줄: 화면 새로고침 시 `index.html`로 (Vite SPA 공식 안내, https://vercel.com/docs/frameworks/frontend/vite). 실제 파일(`/assets/...`)은 rewrites보다 먼저 응답됩니다.
- 외부 대상은 최대 120초까지 기다리고, 넘으면 `ROUTER_EXTERNAL_TARGET_ERROR` (https://vercel.com/docs/limits).
- 문서 예시는 https 대상뿐입니다. 백엔드가 http만 열려 있으면 동작하는지 먼저 확인합니다.

## 3. 환경변수 (Vercel 프로젝트 설정)

| 변수                | Production | Preview          | 설명            |
| ------------------- | ---------- | ---------------- | --------------- |
| `VITE_API_BASE_URL` | `/api`     | `/api`           | rewrites로 넘김 |
| `VITE_USE_MOCK`     | `false`    | `true` (연동 전) | MSW mock        |

- 운영·미리보기 환경변수를 따로 둘 수 있습니다 (https://vercel.com/docs/deployments/environments).
- `VITE_` 값은 번들에 들어갑니다. 비밀 값은 넣지 않습니다. `API_PROXY_TARGET`은 로컬 개발 전용입니다.

## 4. 빌드 설정

- Framework: Vite (자동 인식), Build: `npm run build`, Output: `dist`, Node 24.
- 무료 한도: 월 전송 100GB, 하루 배포 100회, 동시 빌드 1개, 빌드 1회 최대 45분.

## 5. LINE 로그인

- 콜백 URL은 고정된 운영 주소(`https://<프로젝트>.vercel.app/...` 또는 연결한 도메인)로 등록합니다.
- 미리보기 주소는 배포마다 바뀌므로 로그인 테스트는 운영 주소에서 합니다.

## 6. 11/27 첫 배포 체크리스트

- [ ] Vercel 프로젝트 생성, secret 3개 등록, 첫 배포가 Actions로 되는지 확인
- [ ] 환경변수 Production / Preview 설정
- [ ] `vercel.json` 반영, 백엔드 주소(HTTPS) 확인
- [ ] 운영 주소에서 새로고침 404 없는지 (예: `/map`에서 새로고침)
- [ ] 지도(OpenFreeMap)·3D 건물·출처 표시, `/api` 호출이 백엔드까지 가는지
- [ ] 사진 업로드가 rewrites를 거쳐 백엔드까지 가는지
- [ ] 실기기 3종(iOS Safari, Android Chrome, LINE 앱 안)에서 위치 권한·좌표·하단 탭 바·3D 지도 속도
- [ ] LINE 로그인 채널에 운영 주소 콜백 등록

## 7. 11/29 당일

- 마지막 배포는 프리즈 전에 여유를 둡니다. 문제가 생기면 Vercel에서 이전 배포로 되돌립니다 (방법은 첫 배포 때 확인). Actions가 막히면 로컬에서 `vercel --prod`로 배포합니다.
- 지도 타일(OpenFreeMap)은 서비스 보장이 없습니다. 당일 아침 운영 주소에서 확인합니다.
- 행사장 Wi-Fi가 느리면 폰 데이터로 데모합니다.
