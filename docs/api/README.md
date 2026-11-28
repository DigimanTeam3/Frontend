# API 공통 규칙

화면별 API 명세는 그 화면의 GitHub 이슈 본문에 둡니다 (예: S05 → #15). 이 문서는 모든 API가 같이 쓰는 규칙, 화면 코드에서 API를 부르는 방법, mock 작성 규칙, 명세 템플릿을 모읍니다.

- 명세 위치: **그 화면의 GitHub 이슈 본문**. 리뷰·머지 없이 바로 고칠 수 있고, 수정 이력이 남고, 백엔드와 댓글로 합의합니다.
- 화면 PR 본문 맨 위에 `API 명세: #15`처럼 이슈 번호를 적습니다. PR의 `Closes #15`로도 연결됩니다.
- 상태: 초안 → 합의 → 구현 → 연결 완료. 바뀌면 이슈 본문을 고치고 변경 이력에 한 줄 남깁니다.

## 1. 공통 규칙

- 실서버 규약과 37개 API 목록: Backend 이슈 DigimanTeam3/Backend#3 §1. 스키마는 Swagger `<백엔드 주소>/api/docs` (`/api/openapi.json`).
- 경로는 `/api`로 시작합니다. 화면 코드는 `/api`를 빼고 `apiClient('/events')`처럼 씁니다 (`VITE_API_BASE_URL`, 기본 `/api`).
- 필드 이름은 camelCase입니다 (`venueName`, `startDate`). 일본어 번역 필드는 원문 필드 이름 + `Ja`입니다 (`title` / `titleJa`). 번역이 없으면 `null`입니다.
- 시간은 ISO 8601에 한국 시간 오프셋을 붙입니다: `"2026-11-29T10:00:00+09:00"`.
- 로그인이 필요한 API는 `Authorization: Bearer <accessToken>` 헤더로 부릅니다 (`apiClient`가 붙입니다).
- 목록은 `{ "items": [...], "page": 1, "size": 20, "total": 5 }` 모양입니다. 없으면 `items`가 빈 배열입니다.
  - 예외: `GET /saved-conditions`, `GET /notifications`는 `{ "items": [...] }`만, `GET /events/{eventId}/companions`는 여기에 `event`가 더 붙습니다.
  - 화면이 배열만 필요하면 쿼리의 `select: (data) => data.items`로 꺼냅니다. 응답 타입은 래퍼 그대로 둡니다.
- 파일 업로드(`POST /uploads/images`의 `file`, `POST /concierge/transcribe`의 `audio`)는 `FormData`를 `body`로 넘깁니다. `apiClient`는 이때 `Content-Type`을 붙이지 않습니다 (브라우저가 boundary를 붙임).
- 본문이 없는 성공은 `204`입니다.

## 2. 에러

모든 API는 2xx가 아니면 아래 본문을 돌려줍니다. 타입: `ApiErrorBody` (`src/shared/types/api.ts`).

```json
{ "code": "EVENT_NOT_FOUND", "message": "Event not found" }
```

```json
{
  "code": "VALIDATION_ERROR",
  "message": "text: Field required",
  "field": "text",
  "detail": { "errors": [{ "loc": ["body", "text"], "msg": "Field required", "type": "missing" }] }
}
```

| 필드      | 타입   | 필수 | 설명                                                                      |
| --------- | ------ | ---- | ------------------------------------------------------------------------- |
| `code`    | string | ✅   | 화면이 분기하는 고정 이름 (UPPER_SNAKE_CASE)                              |
| `message` | string | ✅   | 로그용 영어 설명. 화면에는 보여 주지 않고 `ja.ts` 문구를 씀               |
| `field`   | string | —    | 입력 검증 에러일 때 문제가 된 요청 필드 이름 (예: `"intro"`)              |
| `detail`  | object | —    | code별 추가 정보. 예: `OUT_OF_RANGE` → `{ distanceMeters, radiusMeters }` |

- Swagger에는 FastAPI 기본 `422 HTTPValidationError`가 적혀 있지만, 실서버는 입력 오류를 위 모양의 `400`으로 돌려줍니다. 422는 처리하지 않아도 됩니다.

상태 코드별 화면 동작 기본값입니다. 화면 명세에서 다르게 정하면 그쪽을 따릅니다.

| 상태 | 대표 code                                                           | 화면 동작                                                               |
| ---- | ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 400  | `VALIDATION_ERROR`, `INVALID_PARAMETER`                             | `field`가 있으면 그 입력 칸 아래에 문구                                 |
| 401  | `UNAUTHORIZED`                                                      | 로그인이 끝난 것으로 보고 로그인 화면으로 (S01 이후 `apiClient`가 처리) |
| 403  | `FORBIDDEN`                                                         | 권한 없음 문구                                                          |
| 404  | `<대상>_NOT_FOUND` (예: `EVENT_NOT_FOUND`), 없는 경로는 `NOT_FOUND` | 「見つかりません」 화면. 다시 시도하지 않음                             |
| 405  | `METHOD_NOT_ALLOWED`                                                | 개발 중 실수. `ja.common.error`                                         |
| 409  | 화면별 (예: `ALREADY_REQUESTED`)                                    | 화면 명세의 문구                                                        |
| 429  | `RATE_LIMITED` + 헤더 `Retry-After: 60`                             | `error.retryAfter`초 동안 보내기 버튼을 막고 남은 시간 표시 (S16)       |
| 500  | `INTERNAL_ERROR`                                                    | `ja.common.error` + 다시 시도 버튼                                      |

## 3. 화면 코드에서 쓰는 법

- API 함수는 기능 폴더의 `api.ts`에 `apiClient`로 만듭니다 (`src/shared/api/client.ts`). `fetch`를 직접 부르지 않습니다.
- 2xx가 아니면 `apiClient`가 `ApiError`를 던집니다 (`src/shared/api/errors.ts`).
  - `error.status` — HTTP 상태
  - `error.code` — 본문의 `code`. 본문이 위 JSON이 아니면 `null`
  - `error.body` — 읽은 본문 `{ code, message, field?, detail? }` 또는 `null`
  - `error.retryAfter` — `Retry-After` 헤더의 초(429), 없으면 `null`. 백엔드가 CORS로 이 헤더를 노출합니다
  - `error.message` — 받은 본문 원문 (로그용)
- 서버에 닿지 못한 경우(오프라인 등)는 `ApiError`가 아니라 `fetch`의 `TypeError`입니다. 화면에서는 500과 같이 「다시 시도」로 처리합니다.
- 에러 분기는 아래 헬퍼를 씁니다. 기능 폴더에 같은 헬퍼를 또 만들지 않습니다.

```ts
import { apiErrorCode, apiErrorField, isApiError } from '@/shared/api/errors'

isApiError(error) // ApiError인지
isApiError(error, 404) // 상태로
isApiError(error, 'EVENT_NOT_FOUND') // code로
apiErrorCode(error) // 'EVENT_NOT_FOUND' | null
apiErrorField(error) // 'intro' | null
```

- 쿼리 재시도 기본값(`src/shared/api/errors.ts`의 `shouldRetryQuery`를 `queryClient.ts`가 기본값으로 씀): 네트워크 에러·5xx는 한 번 더 시도하고, 4xx는 바로 에러로 보여 줍니다. 화면마다 `retry`를 따로 쓰지 않아도 됩니다.
- 쿼리 키는 `src/shared/api/queryKeys.ts`에만 만듭니다. 기능별로 `all` → `list` / `detail` 순서로 쌓아 무효화를 한곳에서 합니다.

## 4. mock 규칙 (`src/mocks`)

- `VITE_USE_MOCK=true`이면 MSW가 `/api`를 대신 응답합니다. mock 응답은 명세의 응답 예시와 같은 모양으로 만듭니다.
- 기능별 handler는 `src/mocks/<feature>Handlers.ts`에 두고, `src/mocks/handlers.ts`에는 `...<feature>Handlers` 한 줄만 더합니다. 데이터는 `src/mocks/data/<feature>.ts`.
- 공통 도우미는 `src/mocks/utils.ts`에 있습니다.

| 도우미                                                  | 용도                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `await mockDelay()`                                     | 모든 응답 앞에 400ms 기다림 (로딩 화면이 보이게)                  |
| `errorResponse(status, code, message, field?, detail?)` | 에러 본문 모양 `{ code, message, field?, detail? }`으로 응답      |
| `mockErrorFor(id)`                                      | 시험용 id면 에러 응답, 아니면 `undefined`                         |
| `MOCK_ERROR_ID.network` = `9001`                        | 네트워크 에러 (`HttpResponse.error()`)                            |
| `MOCK_ERROR_ID.server` = `9002`                         | 500 `INTERNAL_ERROR`                                              |
| `currentUserId(request)`                                | mock 토큰이면 로그인 사용자 id(`MOCK_USER_ID` = 1), 아니면 `null` |
| `unauthorizedResponse()`                                | 401 `UNAUTHORIZED`                                                |
| `rateLimitedResponse(seconds = 60)`                     | 429 `RATE_LIMITED` + `Retry-After` 헤더                           |

- 에러 화면 시험: 경로의 id 자리에 `9001`·`9002`를 넣습니다 (예: `/events/9002`). 404는 없는 id(예: `999`)로 봅니다.

```ts
http.get('/api/events/:eventId', async ({ params }) => {
  await mockDelay()
  const eventId = Number(params.eventId)
  const mockError = mockErrorFor(eventId)
  if (mockError) return mockError
  const event = eventDetails.find((e) => e.id === eventId)
  return event
    ? HttpResponse.json(event)
    : errorResponse(404, 'EVENT_NOT_FOUND', `Event ${eventId} not found`)
})
```

## 5. 명세 템플릿

이슈 본문 제목은 `[<ID> - API 명세 제안] <PR 제목>`입니다. 화면을 그리는 데 필요한 요청·응답 모양만 적습니다.

````md
# [S00 - API 명세 제안] [S00] feat: <summary> #<이슈번호>

- 상태: 초안
- 화면: S00 <화면 이름>
- 담당: 프론트 <이름> · 백엔드 (확인 필요)

## API 목록

| API    | 요청           | 로그인      | 쓰는 화면 |
| ------ | -------------- | ----------- | --------- |
| <이름> | `GET /api/...` | 필요/불필요 | S00 ...   |

## 1. <API 이름>

- 요청: `GET /api/...`
- 로그인: 필요/불필요
- 화면에서 쓰는 곳: ...

### 요청 값

- path `id` (number) — ...
- query `page` (number, 기본 1)

### 응답 (200)

```json
{}
```

### 응답 필드

| 필드 | 타입 | 필수 | 설명 |
| ---- | ---- | ---- | ---- |

### 에러

| 상태 | code | 화면 동작 |
| ---- | ---- | --------- |

## 확인할 것

- ...
````
