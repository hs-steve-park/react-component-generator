# AGENTS.md

## Operational Commands

- 패키지 매니저: `bun` 고정 (`bun.lock`만 존재, `package-lock.json`/`yarn.lock` 없음). `npm`/`yarn`/`pnpm` 사용 금지.
- 의존성 설치: `bun install`
- 개발 서버 전체 실행 (API + Vite 동시): `bun run dev`
- API 서버만 실행: `bun run server` (포트 3002, `--watch`로 자동 재시작)
- 빌드: `bun run build` (`tsc -b && vite build`)
- 린트: `bun run lint`
- 테스트 1회 실행: `bun run test`
- 테스트 watch: `bun run test:watch`

## Golden Rules

### Immutable

- API 키(`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`)는 `server/index.ts:59-62`에서만 `process.env`로 읽는다. 프런트엔드(`src/`)는 항상 Vite 프록시(`vite.config.ts:9-14`)를 거쳐 `/api/*`를 호출해야 하며, Anthropic/Google API를 브라우저에서 직접 호출하지 마라. `.env`는 `.gitignore:29`에 의해 커밋 금지 대상이다.
- 생성된 컴포넌트는 `react-live`의 `noInline` 모드로 브라우저에서 직접 실행된다(`src/components/LivePreview.tsx:14`). 이 모드에서는 `import` 문을 쓸 수 없고 React는 전역으로만 접근 가능하다 — 이는 `server/index.ts:9-20`의 `SYSTEM_PROMPT`가 강제하는 하드 제약이므로, 이 프롬프트나 `LivePreview`의 렌더링 방식을 바꾸면 이미 생성된 컴포넌트가 즉시 깨진다.

### Do's & Don'ts

- `stripCodeFences`와 `ensureRenderCall`(`server/generator.ts`)은 서로 다른 실패 모드(마크다운 펜스 잔존, `render()` 호출 누락)를 막는 이중 방어다. `SYSTEM_PROMPT`가 "no markdown fences"를 요청해도 모델이 이를 어기는 경우가 있어 `stripCodeFences`가 별도로 필요하다 — 한쪽을 근거 없이 제거하지 마라.
- Google 경로는 `withModelFallback`(`server/fallback.ts`)으로 `GOOGLE_MODELS`(`server/index.ts:5`) 목록을 순차 시도하지만, Anthropic 경로(`callAnthropic`, `server/index.ts:68-96`)는 폴백이 없는 의도된 비대칭이다. 두 경로가 대칭이라고 가정하고 리팩터링하지 말고, 폴백 추가는 명시적으로 요청받았을 때만 한다.
- 순수 로직(`server/fallback.ts`, `server/generator.ts`)에는 단위 테스트가 있고, 부수효과가 있는 코드(`server/index.ts`의 `Bun.serve`, `src/`의 컴포넌트·훅)는 테스트 대상에서 제외되어 왔다(`server/generator.ts:1-2` 주석 참고). 새 로직을 추가할 때도 부수효과와 순수 로직을 분리해 테스트 가능한 형태로 유지하라.

## Project Context

프롬프트를 입력하면 AI가 React 컴포넌트를 생성하고 실시간 미리보기를 제공하는 도구.

Tech Stack: React 19, TypeScript, Vite, Bun, react-live, Vitest, Anthropic Claude / Google Gemini API.

## Standards & References

- 코딩 컨벤션은 `eslint.config.js` 참고.
- 커밋 메시지 형식: `<type>: <한국어 요약>` (`feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`).
- 실행 방법과 기능 설명은 `README.md` 참고.

## Maintenance Policy

이 문서와 실제 코드가 어긋난 것을 발견하면 코드를 우선시하고, 이 문서의 업데이트를 제안하라.
