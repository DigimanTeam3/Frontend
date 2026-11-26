# Front 작업 규칙 (상세)

안재현·김태효 두 명이 11/27~11/29 동안 충돌 없이 작업하기 위한 규칙입니다. 요약은 Notion 「Front 작업 규칙·지침」에 있고, 상세는 이 문서에 둡니다.

핵심: **main은 항상 배포 가능 · 기능 1개(이슈 1개) = 브랜치 1개 = PR 1개 · 상대 리뷰 후 Squash merge · 기능별 폴더로 나눠 같은 파일을 덜 건드림**

## 0. 기획안 협업 원칙과의 관계

이 규칙은 기획안 11.3 「공통 협업 원칙」을 front에서 실제로 어떻게 할지 정한 것입니다.

| 기획안 11.3                                                     | 이 문서에서                                                                                                                                           |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| API 우선 협의: 구현 전에 요청/응답 구조를 먼저 합의             | 화면을 만들기 전에 해당 API의 요청/응답을 백엔드와 맞추고, 합의한 모양대로 `shared/types`와 `mocks/`를 먼저 씁니다. 바뀌면 두 파일을 같이 고칩니다    |
| Git 기반 협업: 기능 단위 브랜치, 구현 후 PR                     | 1장(브랜치)·2장(PR)                                                                                                                                   |
| 공통 UI 기준 유지: Frontend 1이 정리한 기준을 Frontend 2도 적용 | 공통 UI 기준(`shared/ui`, `styles/index.css`의 `@theme` 토큰)은 Frontend 1(안재현)이 정리합니다. Frontend 2(김태효)도 이 컴포넌트·토큰을 씁니다 (4장) |
| 기능 단위 통합: 독립 구현 후 API 연동·통합 테스트               | mock으로 기능을 독립적으로 만든 뒤 `VITE_USE_MOCK=false`로 실제 API에 연결합니다                                                                      |
| 배포 환경 공유: Backend 2가 구축한 EC2 기준                     | 배포 ADR. front는 Vercel, 백엔드는 EC2. `/api`는 Vercel rewrites로 백엔드에 넘깁니다 ([deploy.md](deploy.md))                                         |

## 1. 브랜치

- `main` 하나만 오래 살아 있습니다. `main`은 언제든 배포할 수 있는 상태로 둡니다. (`develop` 브랜치는 두지 않습니다 — 3일에는 단계만 늘어납니다.)
- 작업 브랜치 이름: `<type>/<id>-<summary>` (이슈 제목 `[ID] <type> : <summary>`를 소문자로 옮긴 것)
  - 예: `init/c1-repository-setup`, `feat/s02-home`, `fix/s04-map-marker`
  - type: `init`, `feat`, `fix`, `refactor`, `style`, `docs`, `chore`
- **기능 단위로 브랜치를 나눕니다** (기획안 11.3). 기능 하나는 GitHub 이슈 하나입니다.
- 브랜치는 짧게: 반나절 안에 PR을 올릴 크기가 좋습니다. 기능이 그보다 크면 "목록 화면 → API 연동"처럼 더 작은 기능(이슈)으로 나눠 각각 브랜치를 만듭니다.
- 다른 사람 브랜치에는 push하지 않습니다.
- **main 직접 push 금지.** GitHub ruleset 「main protection」으로 main을 보호합니다: 직접 push·강제 push·삭제 금지, PR 필수(승인 1명), Squash merge만 허용. admin도 예외 없습니다.
  - 로컬: `npm install` 시 `.githooks/pre-push`가 켜져 main으로의 push를 push 전에 막습니다.
  - PR: GitHub Actions가 `npm run check`·`build`, PR 제목·브랜치 이름 형식을 확인합니다.

## 2. PR · 리뷰

- 기능 1개(이슈 1개) = 브랜치 1개 = PR 1개. 기능을 다 만든 뒤 PR로 공유합니다.
- PR 크기: 변경 400줄 안쪽을 권장합니다. 화면이 크면 "레이아웃 → 데이터 연결"처럼 나눌 수 있습니다.
- PR을 올리기 전에 `npm run check`(lint + 포맷 + 타입)를 통과시킵니다.
- PR 본문은 템플릿을 따릅니다: 관련 이슈(`Closes #번호`), 한 일, **화면이 바뀌면 스크린샷**, 공통 파일을 건드렸는지.
- 리뷰
  - 상대 한 명이 리뷰합니다. 목표: 요청 후 30분 안에 착수.
  - 보는 것: 화면이 동작하는지, 공통 컴포넌트·타입을 깨지 않는지, 폴더 규칙. 취향 문제는 막지 않고 코멘트만 남깁니다.
  - 승인하면 **작성자가** Squash and merge 하고 브랜치를 지웁니다.
- 충돌: 작성자가 자기 브랜치에서 `git merge origin/main`으로 해결합니다 (공유 브랜치 rebase는 하지 않습니다).
- **11/29 당일**: 당일에도 승인 1명이 있어야 머지됩니다(ruleset). 리뷰 요청을 받으면 바로 확인하고, 머지하면 바로 말로 알리고, 배포 후 폰으로 확인합니다. 마지막 기능 머지·최종 배포 시각은 일정 문서에서 정합니다.

## 3. 커밋 메시지

- 형식: `<type>: <요약>` 영어 한 줄. 범위 괄호는 쓰지 않습니다.
  - 예: `feat: add event list page`, `fix: keep map center after reload`
  - type: `init` 초기 세팅 / `feat` 기능 / `fix` 버그 / `refactor` 동작 안 바뀜 / `style` 화면 스타일·포맷 / `docs` 문서 / `chore` 설정·의존성
- Squash merge라서 `main`에는 **PR 제목이 커밋 메시지**가 됩니다. PR 제목은 `[ID] <type>: <summary> #<이슈번호>` 형식입니다 (예: `[C1] init: repository setup #1`). 작업 브랜치 안의 커밋은 자유롭게 해도 됩니다.

## 4. 폴더 구조

```txt
src/
  app/             앱 조립: router.tsx(라우트 목록), providers.tsx, 공통 레이아웃
  pages/           라우트 1개 = 파일 1개. 기능 컴포넌트를 배치만 함
  features/        기능별 폴더 (담당자가 나뉘는 단위)
    events/        행사 목록·상세
      components/  이 기능에서만 쓰는 컴포넌트
      api.ts       API 호출 함수 + 쿼리 훅
    map/  recruitment/  participation/  mission/  badge/  card/  auth/ …
  shared/          여러 기능이 같이 쓰는 것 (바꾸면 상대에게 알림)
    api/           fetch 래퍼(client.ts), queryClient, queryKeys
    ui/            공통 컴포넌트 (Button, Card, Header …)
    i18n/          ja.ts — 화면 문구(일본어)
    lib/           유틸 (날짜 포맷, 거리 계산 …)
    types/         API 응답 타입
    stores/        Zustand 스토어 (로그인 정보)
  mocks/           MSW handlers.ts, data/
  styles/          index.css (Tailwind, @theme 디자인 토큰)
```

- 기능 폴더 안의 파일은 그 기능 담당자가 자유롭게 고칩니다.
- 공통 UI(`shared/ui`, `@theme` 토큰)는 Frontend 1이 기준을 정리합니다. 필요한 공통 컴포넌트가 없으면 Frontend 2도 만들 수 있지만, PR에서 Frontend 1의 확인을 받습니다 (기획안 11.2·11.3).
- `features/A`가 `features/B`를 직접 import하지 않습니다. 둘 다 쓰는 것은 `shared/`로 옮깁니다.
- **공통 파일**(`app/router.tsx`, `shared/**`, `styles/index.css`, `mocks/handlers.ts`, `package.json`)을 바꾸면 PR 본문에 표시하고 상대에게 바로 알립니다.
- import는 `@/` 별칭을 씁니다 (`@/shared/ui/Button`). 상대 경로 `../../..`는 피합니다.

## 5. 이름 규칙

| 대상          | 규칙                                | 예                               |
| ------------- | ----------------------------------- | -------------------------------- |
| 컴포넌트 파일 | PascalCase.tsx, 파일명 = 컴포넌트명 | `EventCard.tsx`                  |
| 페이지        | `…Page.tsx`                         | `EventDetailPage.tsx`            |
| 훅            | `use…`, camelCase.ts                | `useCurrentPosition.ts`          |
| 그 외 TS 파일 | camelCase.ts                        | `formatDate.ts`                  |
| 폴더          | 소문자 (필요하면 kebab-case)        | `features/recruitment`           |
| export        | 컴포넌트·함수는 named export        | `export function EventCard`      |
| 타입          | PascalCase, Props는 `…Props`        | `Event`, `EventCardProps`        |
| 상수          | UPPER_SNAKE_CASE                    | `DEFAULT_RADIUS_M`               |
| API 함수      | 동사 + 대상                         | `getEvents`, `createRecruitment` |
| 쿼리 훅       | `use` + 대상 + Query/Mutation       | `useEventsQuery`                 |
| 문구 키       | `화면.항목`                         | `ja.eventList.title`             |

- 스타일은 Tailwind 클래스로 씁니다. 색·글꼴은 `@theme` 토큰 이름을 씁니다 (`bg-primary`). 임의의 hex 값을 클래스에 직접 쓰지 않습니다.
- 화면 문구는 `shared/i18n/ja.ts`에 둡니다.

### 모바일 웹 규칙

- 화면 아래에 붙는 요소(탭 바, 하단 버튼)는 `pb-[env(safe-area-inset-bottom)]`로 아이폰 홈 인디케이터를 피합니다 (`index.html`에 `viewport-fit=cover` 설정됨).
- 사진은 업로드 전에 `src/shared/lib/resizeImage.ts`의 `resizeImage(file)`를 거칩니다 (긴 변 1600px, JPEG).
- 위치 기능은 HTTPS에서만 됩니다. 폰에서 시험할 때는 `npm run dev:https` 또는 배포 서버를 씁니다.
- 화면을 다 만들면 iOS Safari, Android Chrome, LINE 인앱 브라우저에서 한 번씩 확인합니다.
- 지도(MapLibre + OpenFreeMap)는 키가 필요 없습니다. 지도 오른쪽 아래 출처 표시는 약관상 필수라 CSS로 가리거나 지우지 않습니다. 길찾기는 `shared/lib/directionsUrl.ts`의 Google Maps 링크를 씁니다.

## 6. 이슈와 PR 연결

- 작업은 GitHub 이슈로 시작합니다 (이슈 목록·분담은 별도 작업 계획 문서에서 정함). 이슈 템플릿: 기능 / 버그.
- 시작할 때 이슈에 자기를 Assignee로 지정합니다.
- 브랜치 이름에 화면·공통 ID를 넣습니다 (`feat/s02-home`).
- PR 본문에 `Closes #<이슈번호>`를 씁니다 → main에 머지되면 이슈가 자동으로 닫힙니다.
- PR 제목에 이슈 ID·번호가 들어가야 하므로, 작은 수정(오타 등)도 이슈를 먼저 만들고 올립니다.

## 7. 환경

- Node 24 LTS (`.nvmrc`), npm. 처음 받으면 `npm install` → `.env.example`을 `.env.local`로 복사 → `npm run dev`.
- `.env.local`, 키 값은 커밋하지 않습니다.
- 의존성 추가는 상대에게 먼저 말하고, 하나의 PR에서 합니다. `package-lock.json` 충돌은 main 쪽 파일을 받은 뒤 `npm install`로 다시 만듭니다.
- 에디터 확장: oxc, Prettier, Tailwind CSS IntelliSense (`.vscode/extensions.json`). 저장 시 포맷을 켭니다.
