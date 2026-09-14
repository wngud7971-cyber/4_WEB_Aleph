# 플랜두씨 다이어리 1

계획(Plan) → 실제로 한 일(Do) → 돌아보기(See)가 하나로 이어지는 다이어리입니다.
로그인은 아직 없습니다. 링크를 아는 사람은 누구나 볼 수 있으니 남이 봐도 괜찮은
내용만 넣으세요.

## 스택

- Next.js 14 (App Router, Server Actions)
- Prisma + PostgreSQL (Vercel Postgres / Supabase / Neon 등 무엇이든 `DATABASE_URL`만 있으면 됩니다)
- 별도 CSS (프레임워크 없음)

## 로컬에서 실행하기

```bash
npm install
cp .env.example .env.local   # DATABASE_URL을 실제 값으로 채우기
npx prisma db push           # 테이블 생성
npm run dev                  # http://localhost:3000
```

## Vercel로 배포하기 (지금까지 하시던 방식과 동일)

1. Postgres 준비: Vercel 대시보드 → Storage → Postgres 추가 (또는 Supabase/Neon에서 만들고
   connection string 복사).
2. 이 폴더를 git 저장소로 올립니다.
   ```bash
   git init
   git add .
   git commit -m "plando diary v1"
   git remote add origin <내 저장소 URL>
   git push -u origin main
   ```
3. Vercel에서 이 저장소를 Import.
4. Vercel 프로젝트 → Settings → Environment Variables에 `DATABASE_URL` 추가
   (비밀값은 **여기에만** 넣고 절대 코드에 커밋하지 않습니다).
5. 배포가 끝나면 Vercel이 만든 URL이 "결과물 주소"입니다. 시크릿 창으로 열어서
   로그인 없이 바로 보이는지 확인하세요.
6. 처음 배포 후 딱 한 번, 테이블을 만들어야 합니다: 로컬에서
   `DATABASE_URL`을 배포용 값으로 바꾸고 `npx prisma db push`를 실행하거나,
   Vercel 빌드 커맨드에 `prisma db push`를 추가해도 됩니다.

## 내 실제 데이터 넣기 (필수)

배포 후 반드시 **직접** 아래를 채우세요 (남의 예시 금지):

1. `/plans/new` — 지금 실제로 하고 있는 일 1개 이상을 계획으로.
2. 그 계획에 딸린 할 일 5개 이상 (`/todos/new`).
3. 실행 기록 3개 이상 (`/execution/new`).
4. `/review`에서 돌아보고, 고칠 점 한 줄을 다음 계획에 반영.

## 통과 기준 자가 점검에 쓴 방법

- **수정 이력**: 계획을 고치면 `PlanRevision`에 이전 값이 먼저 쌓이고, 그 다음
  `Plan`이 갱신됩니다. `/plans/[id]`에서 이력을 볼 수 있습니다.
- **완료 중복 방지**: 완료 처리는 `UPDATE ... WHERE status='todo'` 형태의 조건부
  원자적 갱신이라, 두 번째 요청은 영향받은 행이 0개이므로 기록도 집계도 늘지
  않습니다.
- **지연 판정**: Asia/Seoul 기준 오늘 날짜 문자열과 `dueDate` 문자열을 비교합니다
  (`lib/time.js`, `lib/review.js`).
- **스크립트 방지**: 모든 사용자 입력은 React JSX로 텍스트로만 렌더링되고
  `dangerouslySetInnerHTML`을 쓰지 않으므로, `<script>` 같은 문자열을 넣어도
  글자 그대로 보입니다.
- **비밀값**: `DATABASE_URL`은 서버 전용 환경변수로만 쓰이고(`NEXT_PUBLIC_` 접두어
  없음) 클라이언트 번들에 절대 포함되지 않습니다. `.env*`는 `.gitignore`에 있어
  git에 올라가지 않습니다.

---

## 짧은 확인 방법 (제출용 템플릿 — 실제로 눌러보고 채우세요)

1. **어디로 가나요**: 배포된 주소 → `/review`
2. **세 단계 안에 무엇을 하나요**: (예) 계획별 표에서 "완료" 숫자 클릭 → 필터링된
   할 일 목록 확인 → 그중 하나를 열어 실행 기록까지 확인
3. **무엇이 보이면 통과인가요**: (예) 숫자와 목록에 나온 건수가 정확히 같고,
   실행 기록의 시작/종료/막힌 이유가 보인다
4. **안 될 때는 무엇이 보이나요**: (예) 목록이 비어 있거나, 숫자와 실제 건수가
   다르게 보인다

## AI와 내 판단 3줄 (제출용 템플릿 — 반드시 본인 판단으로 직접 채우세요)

1. **AI에게 맡긴 일**: (예) Next.js/Prisma 골격 코드 작성, 원자적 업데이트로 완료
   중복 막는 방법 설계
2. **내가 직접 판단한 일**: (예) 실제로 세운 계획과 할 일 내용, 태그 체계, 어떤
   기준으로 정렬을 기본값으로 둘지
3. **AI 제안을 따르지 않은 일 (없다면 왜 없었는지)**: (예) 없음 — 구조 제안이
   통과 기준과 잘 맞아서 그대로 따름 / 또는 (예) 완료 이벤트 테이블 이름을
   AI 제안과 다르게 바꿈, 왜냐하면 ...

## 완주 체크리스트 (다시 확인)

- [ ] 계획 → 실제로 한 일 → 돌아보기가 서버 DB로 이어진다
- [ ] 내 실제 계획/할 일/실행 기록이 들어 있다 (5개/3개 이상)
- [ ] 집계 숫자를 눌러 근거 기록으로 갈 수 있다
- [ ] 첫 화면에 로그인 없음 안내가 적혀 있다 (레이아웃에 이미 포함됨)
- [ ] 최종 소스, 스크립트 삽입 방지, 비밀값 미노출을 직접 확인했다
- [ ] 새 시크릿 창에서 계정 생성/로그인/CAPTCHA 없이 열린다
