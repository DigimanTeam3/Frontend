# 작업 규칙

두 명이 짧은 기간 동안 충돌 없이 작업하기 위한 규칙입니다.

## 기본 원칙

- 기능 단위로 브랜치를 나누고, 기능을 다 만들면 PR로 공유합니다.
- 화면을 만들기 전에 API 요청/응답 구조를 백엔드와 먼저 맞추고, 그 모양대로 `src/shared/types`와 `src/mocks`를 씁니다.
- 공통 UI(`src/shared/ui`, `@theme` 토큰) 기준은 Frontend 1이 정리하고 모두 같은 컴포넌트·토큰을 씁니다.

## 브랜치

- `main`은 항상 배포 가능한 상태로 둡니다. **main에 직접 push하지 않습니다.**
- 작업 브랜치: `<type>/<id>-<summary>`. 이슈 제목을 소문자로 옮깁니다 (예: `[S02] feat : home` → `feat/s02-home`, `[C1] init : repository setup` → `init/c1-repository-setup`)
- type: `init`(초기 세팅), `feat`, `fix`, `refactor`, `style`, `docs`, `chore`
- 기능 하나 = 이슈 하나 = 브랜치 하나입니다. 기능이 크면 더 작은 기능(이슈)으로 나눠 반나절 안에 PR을 올릴 크기로 만듭니다. 다른 사람 브랜치에는 push하지 않습니다.
- 이슈 제목: `[ID] <type> : <요약>` (예: `[S02] feat : home`, `[C1] init : repository setup`). ID는 화면(S01~S18)·공통 기반(C1~C10) 번호입니다. PR 제목은 `[ID] <type>: <summary> #<이슈번호>` 형식입니다 (예: `[S02] feat: home #12`, `[C1] init: repository setup #1`).
- 이슈 제목, 브랜치 이름, 커밋 메시지, PR 제목은 모두 영어로 씁니다.

## 자동 확인

- `npm install`을 하면 `main`으로 직접 push하는 것을 막는 git hook(`.githooks/pre-push`)이 켜집니다.
- PR을 올리면 GitHub Actions가 `npm run check`, `npm run build`, PR 제목·브랜치 이름 형식을 확인합니다. 빨간 X가 뜨면 고친 뒤 머지합니다.
- GitHub에서도 main을 보호합니다: 직접 push·강제 push·삭제 금지, PR 필수(승인 1명), Squash merge만 허용. admin도 예외 없습니다.

## PR · 리뷰

- 기능 1개(이슈 1개) = 브랜치 1개 = PR 1개. 변경은 400줄 안쪽을 권장합니다.
- 올리기 전에 `npm run check`를 통과시킵니다.
- 본문에 `Closes #이슈번호`를 적어 머지 시 이슈가 닫히게 합니다. UI가 바뀌면 스크린샷을 붙입니다.
- 상대 한 명이 리뷰합니다 (목표: 30분 안에 착수). 승인 후 **작성자가 Squash and merge** 하고 브랜치를 지웁니다.
- 충돌은 작성자가 자기 브랜치에서 `git merge origin/main`으로 해결합니다.
- 발표 당일에도 승인 1명이 있어야 머지됩니다. 당일에는 리뷰 요청을 받으면 바로 확인하고, 머지하면 바로 알립니다.

## 커밋 메시지

- `<type>: <요약>` 영어 한 줄 (예: `feat: add event list page`). 범위 괄호는 쓰지 않습니다.
- Squash merge라서 PR 제목이 main의 커밋 메시지가 됩니다. PR 제목은 `[ID] <type>: <summary> #<이슈번호>` 형식으로 씁니다.

## 폴더와 공통 파일

- 기능 코드는 `src/features/<기능>/`에 둡니다. 다른 기능 폴더를 직접 import하지 않고, 같이 쓰는 것은 `src/shared/`로 옮깁니다.
- 공통 파일(`src/app/router.tsx`, `src/shared/**`, `src/styles/index.css`, `src/mocks/handlers.ts`, `package.json`)을 바꾸면 PR 본문에 적고 상대에게 바로 알립니다.
- import는 `@/` 별칭을 씁니다 (`@/shared/api/client`).

## 이름 규칙

| 대상               | 규칙                                    | 예                            |
| ------------------ | --------------------------------------- | ----------------------------- |
| 컴포넌트           | PascalCase.tsx, named export            | `EventCard.tsx`               |
| 페이지             | `…Page.tsx`                             | `EventDetailPage.tsx`         |
| 훅                 | `use…` camelCase.ts                     | `useCurrentPosition.ts`       |
| 그 외 파일         | camelCase.ts                            | `formatDate.ts`               |
| 타입               | PascalCase, Props는 `…Props`            | `EventCardProps`              |
| 상수               | UPPER_SNAKE_CASE                        | `DEFAULT_RADIUS_M`            |
| API 함수 / 쿼리 훅 | 동사+대상 / `use…Query`, `use…Mutation` | `getEvents`, `useEventsQuery` |

- 스타일은 Tailwind 클래스로 쓰고, 색·글꼴은 `src/styles/index.css`의 `@theme` 토큰 이름을 씁니다.
- 화면 문구는 `src/shared/i18n/ja.ts`에 둡니다.

## 모바일 웹

- 화면 아래에 붙는 요소(탭 바, 하단 버튼)는 `pb-[env(safe-area-inset-bottom)]`로 아이폰 홈 인디케이터를 피합니다.
- 사진을 올릴 때는 업로드 전에 `src/shared/lib/resizeImage.ts`의 `resizeImage(file)`를 거칩니다 (긴 변 1600px, JPEG).
- 위치 기능은 HTTPS에서만 됩니다. 폰에서 시험할 때는 `npm run dev:https` 또는 배포 서버를 씁니다.
- 지도 오른쪽 아래 출처 표시는 약관상 필수라 가리거나 지우지 않습니다. 길찾기는 `src/shared/lib/directionsUrl.ts`의 Google Maps 링크를 씁니다.

## 의존성

- 패키지를 추가하기 전에 상대에게 말하고, 한 PR에서 추가합니다.
- `package-lock.json` 충돌은 main 쪽 파일을 받은 뒤 `npm install`로 다시 만듭니다.
- `.env.local`과 키 값은 커밋하지 않습니다.
