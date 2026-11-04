# [WHOMEDIA] 대학 원격강좌 동영상 품질 검수 & 제안서 제출 시스템 풀스택 연동 개발 프롬프트 (Codex & Claude 전용 인계서)

> **안내**: 아래의 [프롬프트 시작]부터 [프롬프트 끝]까지의 전체 내용을 **Claude(클로드)나 OpenAI Codex / ChatGPT / Cursor**에 한 번에 복사·붙여넣기 하시면 즉시 모든 설정과 구현 맥락을 100% 파악하고 개발을 이어갈 수 있습니다.

---

## [프롬프트 시작: 아래 내용을 클로드(Claude) 또는 코덱스(Codex)에 그대로 복사하여 입력하세요]

당신은 **(주)후미디어(WHOMEDIA)**의 시니어 프론트엔드/풀스택 엔지니어입니다.
본 프로젝트는 **"대학 원격 정규 교육과정 콘텐츠 개발 사업을 위한 동영상 품질 검수 플랫폼 및 제안서(서류평가) 전용 QR·링크 제출 시스템"**입니다.

AWS나 Firebase 같은 복잡한 외부 유료 인프라 없이도 **GitHub 리포지토리와 Vercel 단독 환경만으로 100% 무료 배포 및 실무 운영이 가능**하도록 설계되어 있으며, 프론트엔드와 관리자 콘솔이 완벽하게 상호 연동된 완성형 프로덕션 상태를 유지해야 합니다.

- **공식 Vercel 배포 URL**: `https://qasystem-psi.vercel.app/`
- **기술 스택**: Vite 6, React 19, TypeScript, Tailwind CSS v4, Lucide React, qrcode
- **배포 인프라**: GitHub Push -> Vercel 자동 감지 및 빌드 (`npm run build` -> `dist/`)

---

### 1. 배포 및 인프라 아키텍처 (GitHub + Vercel Standalone)

1. **SPA 라우팅 무결성 (`vercel.json`)**:
   - `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` 설정을 통해 `/?p=postech`, `/?p=khcu`, `/admin` 등 모든 브라우저 직접 접근 및 새로고침 시 404 없이 100% 정상 작동합니다.
2. **공식 배포 도메인 연동 (`deployDomain`)**:
   - 시스템 내 기본 도메인이 `https://qasystem-psi.vercel.app`으로 고정 연동되어 있습니다.
   - 로컬(`localhost:3000`)이나 개발 미리보기 환경에서 QR코드를 발급하거나 링크를 복사하더라도, 스마트폰 카메라로 스캔 가능한 **공식 Vercel 실서버 주소**로 자동 생성됩니다.
3. **무비용 고성능 동영상 스토리지 (IndexedDB Fallback)**:
   - AWS S3 미설정 시 브라우저 내장 IndexedDB(`whomedia_video_db` / `video_blobs`)로 자동 폴백합니다.
   - 기가바이트(GB) 단위의 대용량 실제 MP4/WebM/MOV 영상 파일이 로컬에 영구 저장되며, `URL.createObjectURL(blob)`을 통해 즉각 고화질 1080p 스트리밍 재생을 지원합니다.
4. **Vercel 실시간 데이터 동기화 팩 (Export / Import Sync JSON)**:
   - 브라우저 간 데이터 격리를 극복하기 위해 관리자 화면 상단에 원클릭 동기화 도구를 제공합니다.
   - `[동기화 데이터 내보내기 (JSON)]`: 등록된 프로젝트, 영상 메타데이터, 차시 정보를 하나의 JSON 파일로 백업.
   - `[동기화 데이터 가져오기 (JSON)]`: `https://qasystem-psi.vercel.app/admin`에서 업로드하여 원클릭 동기화.
5. **외부 Firebase 운영 DB 완전 격리 (Air-Gapped Safety)**:
   - `firebaseClient.ts` 및 `firebaseStore.ts`의 모든 외부 DB 조작 함수에 널 가드가 적용되어 있으며, 환경 변수 부재 시 `firestore = null`로 동작하여 외부 운영 DB를 일체 건드리지 않습니다.

---

### 2. 사용자 시나리오 및 절대 보안 규칙

#### A. 프론트엔드: 외부 심사위원 전용 뷰 (Public Evaluator View)
- **진입 경로**: 제안서(한글/워드/PPT) 인쇄물 QR코드 또는 전용 링크
  - **기관 전체 검수 링크**: `https://qasystem-psi.vercel.app/?p=postech` (포항공대), `/?p=khcu` (경희사이버대)
  - **차시별 개별 영상 검수 링크**: `https://qasystem-psi.vercel.app/?p=postech&v=vid-...` (특정 강의 1:1 즉시 재생)
- **[절대 보안 원칙 1] 타사 정보 일체 차단**:
  - 사이드바 `내 프로젝트` 영역에는 오직 배정된 단일 기관(예: `포항공대 샘플영상` 또는 `경희사이버대학교`)만 단독 표시됩니다.
  - 타 대학, 타 고객사, 경쟁사 프로젝트 목록은 100% 격리·차단되어 심사위원에게 절대 노출되지 않습니다.
- **[절대 보안 원칙 2] 관리자 메뉴 숨김**:
  - `[제안샘플 사이트]`, `[프로젝트 관리]`, `[운영 콘솔]` 메뉴 및 상단 `[동영상 업로드]` 버튼, 관리자용 QR 발급 버튼은 심사위원 화면에서 **완전히 숨김 처리**됩니다.
- **[절대 디자인 원칙 3] 인위적인 개발용 문구 배제**:
  - "현재: 심사위원 제출 링크 뷰", "제안 심사용 모드", "타사 프로젝트 격리 차단" 같은 어색한 개발용 메타 문구를 UI에 절대 노출하지 마십시오. 자연스럽고 완성도 높은 상용 플랫폼 인터페이스를 유지해야 합니다.

#### B. 어드민: 후미디어 내부 콘솔 (Internal Admin Console, `/admin`)
- **진입 경로**: `/admin` 경로 또는 하단 푸터 `· 관리자` 토글 (`isAdminMode = true`)
- **핵심 기능**:
  1. **프로젝트 관리**: 신규 대학/사업 등록, 고유 슬러그(alias) 발급, 주차/차시 트리 일괄 관리
  2. **동영상 업로드**: 실제 강의 영상 파일(MP4, WebM, MOV, MKV)을 선택하여 저장소에 저장하고 해당 차시와 즉각 연결
  3. **제안서 제출용 QR코드 및 전용 링크 발급**:
     - **기관/프로젝트 전체 QR**: `[QR 발급 (전체)]` 버튼 -> `/?p=${대학슬러그}`
     - **차시별 개별 영상 QR**: 각 영상 행의 `[QR 발급 (개별)]` 버튼 -> `/?p=${대학슬러그}&v=${영상ID}`
     - 고해상도 인쇄용 PNG 원클릭 다운로드 (`${대학슬러그}_${주차}_${차시명}_QR.png`)
     - 원클릭 링크 복사 및 `[새 탭 테스트]` 버튼
  4. **영상 자산 관리 (Storage)**: 저장된 영상 원본 파일 목록, 파일 크기, 다운로드/삭제
  5. **대시보드 & 활동 감사 로그**: 승인/반려 현황 집계, CSV 리포트 내보내기, 검수자 활동 로그 기록

---

### 3. 실제 파일 업로드 원칙 (Zero Mock Data)

- 과거 구글 데모 mp4 등 가짜 목데이터 영상은 전면 삭제되었습니다.
- 외부 스트림 링크 입력 방식 또한 제거되었으며, 오직 실제 비디오 파일(MP4/WebM/MOV) 업로드만 지원합니다.
- 등록된 영상이 없을 때는 사용자에게 친절한 Empty State 안내가 표시됩니다.

---

### 4. 환경 변수 명세 (.env)

```env
# Public Deployment URL (제안서 QR 및 외부 심사위원 제출 링크 기준 도메인)
VITE_PUBLIC_APP_URL=https://qasystem-psi.vercel.app

# Gemini AI (선택 사항: AI 영상 분석 및 자막 생성)
GEMINI_MODEL=gemini-2.5-flash

# AWS S3 Presigned URL Backend API (선택 사항: 미설정 시 브라우저 내장 IndexedDB로 100% 자동 동작)
S3_PRESIGN_API_BASE=https://your-s3-presign-api.execute-api.ap-northeast-2.amazonaws.com
VITE_S3_PRESIGN_API_BASE=https://your-s3-presign-api.execute-api.ap-northeast-2.amazonaws.com

# Firebase Firestore & Auth (선택 사항: 미설정 시 브라우저 LocalStorage로 100% 자동 동작)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

*AWS와 Firebase가 없어도 Vercel 단독 환경에서 100% 완벽하게 동작합니다.*

---

### 5. 핵심 파일 구조 및 역할

```
├── vercel.json                        # SPA rewrite 설정 (404 방지)
├── package.json                       # Vite + React 19 + Tailwind v4 + qrcode
├── CLAUDE.md                          # 클로드 코드 시스템 가이드
├── HANDOVER_PROMPT.md                 # 본 인계용 프롬프트 문서
├── src/
│   ├── App.tsx                        # 루트 레이아웃, 라우트 파싱(?p=..., ?v=...), 공유 영상 자동 오픈
│   ├── context/
│   │   └── AppContext.tsx             # 전역 상태 (영상, 프로젝트, deployDomain, export/importSyncData)
│   ├── components/
│   │   ├── VideoTable.tsx             # 메인 강의 영상 검수 테이블 & Empty State & [QR·공유]
│   │   ├── ReviewModal.tsx            # 동영상 재생 플레이어 및 타임코드별 의견 검수 모달
│   │   ├── UploadModal.tsx            # 실제 영상 파일(MP4/WebM/MOV) 업로드 모달
│   │   ├── AdminLayout.tsx            # 관리자 전용 운영 콘솔 레이아웃 (/admin)
│   │   ├── AdminDashboard.tsx         # 관리자 통계 대시보드 (CSV 내보내기, 승인율)
│   │   ├── MediaStorageManager.tsx    # 실제 업로드 영상 자산 관리 (S3/IndexedDB)
│   │   ├── PipelineMonitor.tsx        # 처리 파이프라인 모니터
│   │   ├── AuditLogView.tsx           # 작업자별 활동 감사 로그
│   │   ├── ProjectRegistrationView.tsx# Vercel 연동 배너, 신규 프로젝트/영상 등록, QR 발급 모달(전체/개별)
│   │   ├── ProposalSampleView.tsx     # 관리자용 제안샘플 카드 관리 및 전용 QR 발급
│   │   ├── ShareModal.tsx             # 단일 영상 검수 공유 링크 및 QR코드 생성 모달
│   │   └── WhomediaLogo.tsx           # 후미디어 공식 브랜드 로고
│   ├── data/
│   │   ├── initialData.ts             # 초기화 데이터 (가짜 목데이터 0건)
│   │   ├── projectData.ts             # 포항공대(postech) 및 경희사이버대(khcu) 기본 프로젝트
│   │   └── proposalSampleData.ts      # 제안서 샘플 메타데이터
│   └── utils/
│       ├── s3Storage.ts               # S3 업로드 및 IndexedDB 영구 저장 폴백
│       ├── firebaseClient.ts          # 에어갭 격리 처리된 Firebase 클라이언트
│       ├── firebaseStore.ts           # Firestore 및 LocalStorage 폴백 데이터 스토어
│       └── i18n.ts                    # 한국어/영어 다국어 번역 사전
```

---

### 6. 클로드/코덱스 당신이 이어서 완벽하게 점검 및 개발할 과제

1. **Vercel 프로덕션 배포 상태 유지**:
   - 변경 사항이 발생하면 `npm run lint` (`tsc --noEmit`)와 `npm run build`를 실행하여 컴파일 오류가 전혀 없음을 확인하십시오.
   - Vercel 배포 URL(`https://qasystem-psi.vercel.app/`)이 정상 응답하는지 점검하십시오.
2. **개별 QR코드 및 제안서 전용 링크 검증**:
   - 프로젝트 전체 QR(`/?p=postech`, `/?p=khcu`)과 차시별 개별 영상 QR(`/?p=postech&v=...`)이 올바른 배포 주소로 발급되는지 확인하십시오.
   - 다운로드되는 PNG 파일명이 규격에 맞게 저장되는지 확인하십시오.
3. **스마트폰/외부 평가위원 접속 환경 무결성**:
   - 모바일 기기나 외부 브라우저에서 스캔했을 때 로그인 요청 없이 바로 검수 화면이 열리는지 확인하십시오.

지금부터 위 코드베이스와 규칙을 완전히 준수하여, GitHub + Vercel 단독 배포에 최적화된 완성형 프로덕션 상태로 개발을 이어가십시오.

## [프롬프트 끝]

