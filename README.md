# 팀 할일 스케줄러

주차별로 관리하는 팀 할일 관리 웹앱. Next.js(App Router) + TypeScript + Tailwind CSS로 만들었고, 데이터는 서버의 `data/tasks.json` 파일에 저장합니다. 같은 서버 주소로 접속하는 모든 사람이 새로고침하면 서로의 변경사항을 볼 수 있습니다.

## 데이터 저장 방식

요구사항에는 "로컬 SQLite(Prisma) 또는 간단한 JSON 파일"이 옵션으로 주어졌는데, 이 프로젝트는 **JSON 파일 기반**을 기본으로 하되, 서버리스 배포(Vercel)에서도 그대로 동작하도록 **Vercel KV(Upstash Redis)를 자동 폴백 백엔드**로 붙였습니다 (`src/lib/store/`).

- 로컬 개발(`npm run dev`): KV 관련 환경 변수가 없으면 자동으로 `data/tasks.json` 파일을 사용합니다. 별도 설정 없이 바로 실행됩니다.
- Vercel 배포: 프로젝트에 Upstash(Vercel KV) 스토리지를 연결하면 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 환경 변수가 자동 주입되고, 앱이 이를 감지해 Redis에 데이터를 저장합니다. Vercel의 배포 폴더는 읽기 전용이라 JSON 파일 쓰기가 불가능하기 때문입니다.

어느 백엔드를 쓰든 API(`src/app/api/tasks`)와 나머지 코드는 동일하게 동작하며, 저장소 전환 로직은 `src/lib/store/index.ts` 한 곳에만 있습니다.

## 폴더 구조

```
scheduler/
├─ data/
│  └─ tasks.json          # 할일 데이터 (최초엔 빈 배열)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx        # 공통 레이아웃 (상단 네비 + 이름 입력 게이트)
│  │  ├─ page.tsx          # "/" → "/board" 리다이렉트
│  │  ├─ board/page.tsx    # 1) 일별/주차별 칸반 보드 뷰
│  │  ├─ weekly/page.tsx   # 2) 주간 스케줄 뷰 (월~일 7일 그리드)
│  │  ├─ monthly/page.tsx  # 3) 월간 스케줄 뷰 (달력)
│  │  ├─ day/[date]/page.tsx  # 월간 보기에서 날짜 클릭 시 상세 리스트
│  │  └─ api/tasks/            # REST API (GET/POST, PATCH/DELETE by id)
│  ├─ components/          # TopNav, AuthorProvider, TaskCard, KanbanColumn 등
│  └─ lib/                 # types.ts(모델), week.ts(주차 계산), db.ts(JSON 저장소), api.ts(클라이언트 fetch), author.ts
└─ README.md
```

## 데이터 모델 (`src/lib/types.ts`)

```ts
Task {
  id: string
  content: string          // 할일 내용
  day: "MON"|"TUE"|"WED"|"THU"|"FRI"|"SAT"|"SUN"
  weekStart: string        // 해당 주 월요일 날짜 (yyyy-MM-dd)
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE"
  author: string           // 작성자 이름 (로그인 없이 로컬 저장된 이름)
  memo: string             // 상세 페이지에서 남기는 자유 메모
  createdAt: string
  updatedAt: string
}
```

주차 계산 로직(`src/lib/week.ts`)은 월요일 시작·일요일 종료 기준이며, "N주차"는 해당 월 안에서 몇 번째 월~일 주간인지로 계산합니다(그 달의 첫 번째 월요일이 속한 주가 1주차).

## 로컬 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속 → 처음 접속 시 이름을 입력하면 브라우저(로컬 스토리지)에 저장되고, 이후 만드는 모든 할일에 자동으로 태그됩니다.

여러 명이 같은 서버에서 함께 쓰려면, 서버를 실행 중인 PC의 IP로 다른 팀원들이 접속하면 됩니다 (예: `http://<서버-PC-IP>:3000`, 같은 네트워크 기준).

프로덕션으로 실행하려면:

```bash
npm run build
npm run start
```

## 배포 (Vercel)

1. GitHub 등에 리포지토리를 올린 뒤 [vercel.com](https://vercel.com)에서 Import (또는 `vercel` CLI로 바로 배포)
2. 프로젝트의 **Storage** 탭에서 Upstash(Redis) 통합을 연결합니다. 연결하면 `KV_REST_API_URL` / `KV_REST_API_TOKEN` 환경 변수가 자동으로 추가됩니다.
3. 환경 변수가 반영되도록 한 번 재배포하면, 여러 사람이 같은 배포 주소로 접속해 새로고침만으로 서로의 변경사항을 볼 수 있습니다.

Upstash 연결 없이 배포하면 앱 자체는 뜨지만 할일을 추가하는 순간 파일 쓰기 오류가 납니다(Vercel 배포 폴더는 읽기 전용이기 때문). 상시 구동되는 VPS/사내 서버에 `npm run build && npm run start`로 올리는 경우에는 KV 연결 없이 기존 JSON 파일 방식 그대로 사용해도 됩니다.

## 주요 기능

- 보드 뷰: 주차 헤더("7월 2주차 (7/6~7/12)") + 요일 탭 + 시작 전/진행 중/완료 3단 칸반.
- 이월(carry-over): 오늘 탭에서는 지난 날짜에 만들어졌지만 아직 완료되지 않은 할일이 원래 날짜 배지("7/6부터")와 함께 자동으로 같이 보입니다. 완료 처리 전까지 그대로 유지됩니다.
- 할일 카드는 클릭하면 상세 페이지(`/task/[id]`)로 이동해서 내용 수정, 상태 변경(시작 전/진행 중/완료 중 아무 상태로나 바로 전환), 메모 작성이 가능합니다. 카드 자체는 슬림하게 유지하고, 작성자는 우측 하단 원형 이니셜 배지로 표시합니다.
- 주간 뷰: 월~일 7일을 가로로 넓은 카드 형태(가로 스크롤)로 펼쳐서 요일별 할일과 완료율을 확인.
- 월간 뷰: 달력에 날짜별 할일 개수와 완료율(막대)을 표시. 날짜 클릭 시 해당 날짜의 상세 리스트로 이동.
- 할일 추가는 입력 후 Enter로 즉시 등록, 삭제는 실수 방지를 위해 가벼운 확인 단계를 거칩니다.
- 모바일 반응형 레이아웃.
