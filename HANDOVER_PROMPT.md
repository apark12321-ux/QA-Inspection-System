# [WHOMEDIA] 대학 원격강좌 동영상 품질 검수 & 제안서 제출 시스템 풀스택 연동 개발 프롬프트 (Claude 인계용)

> **안내**: 아래의 [프롬프트 시작]부터 [프롬프트 끝]까지의 전체 내용을 **Claude Code(클로드)**에 한 번에 복사·붙여넣기 하시면 즉시 모든 설정과 구현을 이어받아 실행할 수 있습니다.

---

## [프롬프트 시작: 아래 내용을 클로드(Claude)에 그대로 복사하여 입력하세요]

당신은 **(주)후미디어(WHOMEDIA)**의 시니어 프론트엔드/풀스택 엔지니어입니다.
본 프로젝트는 **"대학 원격 정규 교육과정 콘텐츠 개발 사업을 위한 동영상 품질 검수 플랫폼 및 제안서(서류평가) 전용 QR·링크 제출 시스템"**입니다.
AWS나 Firebase 같은 외부 유료 인프라 없이도 **GitHub 리포지토리와 Vercel 단독 환경만으로 100% 무료 배포 및 실무 운영이 가능**하도록 설계되어 있으며, 프론트엔드와 관리자 콘솔이 완벽하게 상호 연동된 완성형 프로덕션 상태를 유지해야 합니다.

---

### 1. 배포 및 인프라 아키텍처 (GitHub + Vercel Standalone)

1. **호스팅 및 빌드**:
   - GitHub Push -> Vercel 자동 감지 및 빌드 (`npm run build` -> `dist/`)
   - Vite 6 + React 19 SPA 구조이며 서버 설정 없이 완전 독립 정적 호스팅 가능
2. **SPA 라우팅 무결성 (`vercel.json`)**:
   - `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` 설정을 통해 `/?p=khcu`, `/khcu`, `/admin` 등 모든 브라우저 직접 접근 및 새로고침 시 404 없이 100% 정상 작동
3. **무비용 고성능 동영상 스토리지 (IndexedDB Fallback)**:
   - AWS S3 API(`VITE_S3_PRESIGN_API_BASE`) 미설정 또는 네트워크 실패 시, 브라우저 내장 IndexedDB(`whomedia_video_db` / `video_blobs`)로 자동 폴백
   - 기가바이트(GB) 단위의 대용량 실제 MP4/WebM/MOV 영상 파일이 로컬에 영구 저장되며, `URL.createObjectURL(blob)`을 통해 즉각 고화질 1080p 스트리밍 재생 지원
4. **로컬 무손실 데이터베이스 (LocalStorage Sync)**:
   - 등록 프로젝트(`video_review_projects_v1`), 실제 업로드 비디오 메타데이터(`video_review_videos_v1`), 타임코드 검수 의견, 승인/반려 상태, 활동 감사 로그(`video_review_logs_v1`)가 실시간으로 보존 및 동기화

---

### 2. 사용자 시나리오 및 절대 보안 규칙

#### A. 프론트엔드: 외부 심사위원 전용 뷰 (Public Evaluator View)
- **진입 경로**: 제안서(HWP/PPT) QR코드 또는 전용 URL(예: `/?p=khcu` 또는 `https://.../khcu`)
- **화면 구성**: 실제 상용 동영상 품질 검수 시스템 (고화질 플레이어, 0.5x~2.0x 배속, 타임코드 클릭 시 해당 재생 시점 즉각 점프, 검수 의견 작성 등)
- **[절대 보안 원칙 1] 타사 정보 일체 차단**:
  - 사이드바 `내 프로젝트` 영역에는 오직 배정된 단일 기관(예: `경희사이버대학교`)만 단독 표시됩니다.
  - 타 대학, 타 고객사, 경쟁사 프로젝트 목록은 100% 격리·차단되어 심사위원에게 절대 노출되지 않습니다.
- **[절대 보안 원칙 2] 관리자 메뉴 숨김**:
  - `[제안샘플 사이트]`, `[프로젝트 관리]`, `[운영 콘솔]` 메뉴 및 상단 `[동영상 업로드]` 버튼, 테이블의 `[제안서 제출용 QR·링크]` 발급 버튼은 심사위원 화면에서 **완전히 숨김 처리**됩니다.
- **[절대 디자인 원칙 3] 인위적인 개발용 문구 배제**:
  - "현재: 심사위원 제출 링크 뷰", "제안 심사용 모드", "타사 프로젝트 격리 차단" 같은 어색한 개발용 메타 문구를 UI에 절대 노출하지 마십시오. 자연스럽고 완성도 높은 상용 플랫폼 인터페이스를 유지해야 합니다.

#### B. 어드민: 후미디어 내부 콘솔 (Internal Admin Console, `/admin`)
- **진입 경로**: `/admin` 경로 또는 하단 푸터 `· 관리자` 토글 (`isAdminMode = true`)
- **핵심 기능**:
  1. **프로젝트 관리**: 신규 대학/사업 등록, 고유 슬러그(alias) 발급, 주차/차시 트리 일괄 관리
  2. **동영상 업로드**: 실제 강의 영상 파일(MP4, WebM, MOV, MKV)을 선택하여 저장소(S3/IndexedDB)에 저장하고 해당 차시와 즉각 연결
  3. **제안서 제출용 QR코드 및 전용 링크 발급**: 제안서 삽입용 고해상도 인쇄용 QR PNG 다운로드 및 원클릭 복사
  4. **영상 자산 관리 (Storage)**: 저장된 영상 원본 파일 목록, 파일 크기, 다운로드/삭제
  5. **대시보드 & 활동 감사 로그**: 승인/반려 현황 집계, CSV 리포트 내보내기, 검수자 활동 로그 기록
- **프론트-어드민 완벽 연동**:
  - 어드민에서 프로젝트를 추가하거나 영상을 업로드하면 프론트엔드 검수 화면에 즉시 동기화되어 나타납니다.
  - 프론트엔드 검수 화면에서 검수자가 남긴 의견(타임코드, 승인/반려)은 어드민 감사 로그와 대시보드 통계에 실시간 반영됩니다.

---

### 3. 실제 파일 업로드 원칙 (Zero Mock Data)

- 과거 구글 데모 mp4 등 가짜 목데이터 영상은 전면 삭제되었습니다.
- 외부 스트림 링크 입력 방식 또한 제거되었으며, 오직 실제 비디오 파일(MP4/WebM/MOV) 업로드만 지원합니다.
- 등록된 영상이 없을 때는 사용자에게 친절한 Empty State 안내가 표시됩니다.

---

### 4. 환경 변수 명세 (.env)

```env
# Gemini AI (선택 사항)
GEMINI_MODEL=gemini-2.5-flash

# AWS S3 Presigned URL Backend API (선택 사항: 미설정 시 브라우저 내장 IndexedDB로 100% 자동 동작)
S3_PRESIGN_API_BASE=https://your-s3-presign-api.execute-api.ap-northeast-2.amazonaws.com
VITE_S3_PRESIGN_API_BASE=https://your-s3-presign-api.execute-api.ap-northeast-2.amazonaws.com

# Firebase Firestore & Auth (선택 사항: 미설정 시 브라우저 LocalStorage로 100% 자동 동작)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

*AWS와 Firebase가 없어도 Vercel 단독 환경에서 100% 완벽하게 동작합니다.*

---

### 5. 핵심 파일 구조 및 역할

```
├── vercel.json                        # SPA rewrite 설정 (404 방지)
├── package.json                       # Vite + React 19 + Tailwind v4 + qrcode
├── CLAUDE.md                          # 클로드 코드 시스템 가이드
├── src/
│   ├── App.tsx                        # 루트 레이아웃, 라우트 파싱(?p=...), 심사위원/관리자 모드 분기
│   ├── context/
│   │   └── AppContext.tsx             # 전역 상태 (동영상, 프로젝트, 권한, LocalStorage 동기화)
│   ├── components/
│   │   ├── VideoTable.tsx             # 메인 강의 영상 검수 테이블 & Empty State
│   │   ├── ReviewModal.tsx            # 동영상 재생 플레이어 및 타임코드별 의견 검수 모달
│   │   ├── UploadModal.tsx            # 실제 영상 파일(MP4/WebM/MOV) 업로드 모달
│   │   ├── AdminLayout.tsx            # 관리자 전용 운영 콘솔 레이아웃 (/admin)
│   │   ├── AdminDashboard.tsx         # 관리자 통계 대시보드 (CSV 내보내기, 승인율)
│   │   ├── MediaStorageManager.tsx    # 실제 업로드 영상 자산 관리 (S3/IndexedDB)
│   │   ├── PipelineMonitor.tsx        # 처리 파이프라인 모니터
│   │   ├── AuditLogView.tsx           # 작업자별 활동 감사 로그
│   │   ├── ProjectRegistrationView.tsx# 신규 프로젝트 및 주차/차시 등록 뷰
│   │   ├── ProposalSampleView.tsx     # 관리자용 제안샘플 카드 관리 및 전용 QR 발급
│   │   ├── ShareModal.tsx             # 단일 영상 검수 공유 링크 모달
│   │   └── WhomediaLogo.tsx           # 후미디어 공식 브랜드 로고
│   ├── data/
│   │   ├── initialData.ts             # 초기화 데이터 (가짜 목데이터 0건)
│   │   ├── projectData.ts             # 경희사이버대학교 단일 기관 기본 프로젝트 구조
│   │   └── proposalSampleData.ts      # 제안서 샘플 메타데이터
│   └── utils/
│       ├── s3Storage.ts               # S3 업로드 및 IndexedDB 영구 저장 폴백
│       ├── firebaseStore.ts           # Firestore 및 LocalStorage 폴백 데이터 스토어
│       └── i18n.ts                    # 한국어/영어 다국어 번역 사전
```

---

### 6. 클로드 당신이 이어서 완벽하게 점검 및 확인할 사항

1. **프론트-어드민 연동 확인**:
   - `/admin` 또는 `[프로젝트 관리]`에서 신규 프로젝트를 추가하거나, `[동영상 업로드]`로 실제 MP4 파일을 등록했을 때 메인 검수 화면과 사이드바에 즉각 반영되는지 확인하십시오.
   - 플레이어(`ReviewModal`)에서 타임코드 의견을 등록하고 승인/반려 상태를 변경했을 때 어드민 대시보드와 활동 로그에 실시간 반영되는지 확인하십시오.
2. **Vercel 단독 구동 검증**:
   - 외부 API 키가 없는 환경에서도 로컬 IndexedDB 스토리지와 LocalStorage를 통해 영상 등록/재생/검수 의견 작성이 100% 무결하게 동작하는지 확인하십시오.
3. **빌드 검증**:
   - `npm run lint` (`tsc --noEmit`) 및 `npm run build`를 실행하여 컴파일 오류가 전혀 없도록 유지하십시오.

지금부터 기존 코드베이스를 확인하고, GitHub + Vercel 단독 배포에 최적화된 완성형 프로덕션 상태로 개발을 이어가십시오.

## [프롬프트 끝]
