<!-- PR 제목 = main 커밋 메시지입니다. `[ID] <type>: <summary> #<이슈번호>` 영어 한 줄 (예: [C1] init: repository setup #1) -->

## 관련 이슈

Closes #

## 한 일

-

## 화면 (UI가 바뀌면)

| 전  | 후  |
| --- | --- |
|     |     |

## 체크

- [ ] `npm run check` 통과
- [ ] 브랜치 이름이 `<type>/<id>-<summary>` 형식 (예: `feat/s02-home`)
- [ ] 화면을 바꿨다면 iOS Safari / Android Chrome / LINE 인앱 중 한 곳 이상에서 확인
- [ ] 공통 파일을 바꿨다면 아래에 적고 상대에게 알림 (`app/router.tsx`, `shared/**`, `styles/index.css`, `mocks/handlers.ts`, `package.json`)

공통 파일 변경:

<!-- 머지: 상대 1명 승인 후 작성자가 Squash and merge → 브랜치 삭제. 11/29 당일에도 승인 1명 필요(main ruleset). 머지 후 바로 알림. -->
