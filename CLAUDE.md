# [WHOMEDIA] 대학 원격 정규 교육과정 동영상 품질 검수 & 제안서 제출 시스템

이 문서는 **Claude Code(클로드 코드)**가 본 프로젝트의 아키텍처, 비즈니스 규칙, 권한 격리 및 환경 변수를 완벽히 파악하여 일관되게 개발을 지속할 수 있도록 정의한 개발 지침서입니다.

---

## 1. 프로젝트 정체성 및 비즈니스 목적

(주)후미디어(WHOMEDIA)의 대학 원격강좌 영상 제작 사업을 위한 전문 검수 플랫폼입니다.
주요 사용자는 다음 두 그룹입니다:

1. **제안서 서류평가 심사위원 / 외부 고객 (Public Evaluator View)**
   - 제안서(한글/워드/PPT)에 삽입된 **QR코드** 또는 **전용 URL**(`/?p=khcu` 등)로 접속합니다.
   - 전체 검수 시스템(고화질 영상 플레이어, 타임코드별 의견 작성, 0.5x~2.0x 배속, AI 자막 등)을 활용해 영상을 심사합니다.
   - **[절대 보안 원칙 1] 타사 프로젝트명 노출 금지**: 사이드바의 `내 프로젝트` 영역에는 배정된 단일 기관(예: `경희사이버대학교`)만 표시되며 타 대학이나 경쟁사 명칭은 100% 격리 차단되어야 합니다.
   - **[절대 보안 원칙 2] 관리자 기능 비노출**: `[제안샘플 사이트]`, `[프로젝트 관리]`, `[운영 콘솔]` 메뉴 및 `[동영상 업로드]` 버튼, 관리자용 QR 발급 버튼은 심사위원 화면에서 **완전히 숨김 처리**됩니다.
   - **[절대 디자인 원칙 3] 인위적인 문구 배제**: "현재: 심사위원 제출 링크 뷰", "제안 심사용 모드", "타사 프로젝트 격리" 등과 같은 인위적인 개발용 메타 문구를 UI에 절대 노출하지 마십시오. 자연스럽고 완성도 높은 상용 플랫폼 인터페이스를 유지해야 합니다.

2. **후미디어 내부 관리자 (Internal Admin View)**
   - 관리자 모드(`isAdminMode = true` 또는 `/admin` 경로)로 접속합니다.
   - 프로젝트 등록/관리, 실제 동영상 파일 업로드, 제안서 기재용 QR코드(PNG 다운로드) 및 링크 발급, AWS S3/MediaConvert 파이프라인 모니터링이 가능합니다.

3. **실제 파일 업로드 원칙 (Zero Mock Data)**
   - 과거 테스트용 가짜 목데이터 영상(구글 클라우드 샘플 mp4 등)은 전면 삭제되었습니다.
   - 오직 사용자가 **실제 파일 업로드(S3 Presigned URL)**를 통해 등록한 영상 파일만 검수 목록과 스토리지 관리자에 표시되어야 합니다.

---

## 2. 개발 및 빌드 명령어

```bash
# 개발 서버 실행 (포트 3000)
npm run dev

# 타입스크립트 타입 체크
npm run lint
# 또는
npx tsc --noEmit

# 프로덕션 빌드 검증
npm run build
```

---

## 3. 환경 변수 구성 (.env)

프로젝트 루트의 `.env` 파일에 다음 환경 변수를 설정하여 동작합니다:

```env
# Gemini AI
GEMINI_MODEL=gemini-2.5-flash

# AWS S3 Presigned URL Backend API
S3_PRESIGN_API_BASE=https://your-s3-presign-api.execute-api.ap-northeast-2.amazonaws.com
VITE_S3_PRESIGN_API_BASE=https://your-s3-presign-api.execute-api.ap-northeast-2.amazonaws.com

# Firebase Firestore & Auth (클라이언트 연동)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
```

*클라이언트(React/Vite) 코드에서 참조하는 모든 환경 변수는 `import.meta.env.VITE_*` 방식을 따릅니다.*

---

## 4. 핵심 기술 스택

- **UI Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (글로벌 CSS에 `@import "tailwindcss";` 사용), Pretendard 폰트
- **Icons**: Lucide React
- **Video Review Player**: 
  - 커스텀 HTML5 비디오 플레이어 (`src/components/ReviewModal.tsx`)
  - 1080p 고화질 렌더링, 타임코드 클릭 시 해당 재생 시점 점프, 배속 조절(0.5x~2.0x), 의견 작성 타임라인 핀
- **Storage & Upload**:
  - `src/utils/s3Storage.ts`: `VITE_S3_PRESIGN_API_BASE`를 활용한 AWS S3 직접 업로드
  - 브라우저 IndexedDB / Blob URL 폴백 지원
- **Database & Sync**:
  - `src/utils/firebaseStore.ts`: Firebase Firestore를 통한 검수 의견, 승인/반려 상태 실시간 동기화
- **QR Code**: `qrcode` 라이브러리를 활용한 제안서 삽입용 고해상도 인쇄용 PNG 다운로드 지원

---

## 5. 주요 파일 및 디렉터리 역할

```
├── .env.example                       # 환경 변수 템플릿
├── CLAUDE.md                          # 클로드 코드 개발 지침서 (본 문서)
├── src/
│   ├── App.tsx                        # 루트 레이아웃, 라우트 파싱 및 심사위원/관리자 모드 분기
│   ├── context/
│   │   └── AppContext.tsx             # 전역 상태 (영상 목록, 프로젝트, 권한 상태, 언어 등)
│   ├── components/
│   │   ├── VideoTable.tsx             # 메인 강의 영상 검수 테이블 & Empty State
│   │   ├── ReviewModal.tsx            # 동영상 재생 및 타임코드별 의견 검수 모달
│   │   ├── UploadModal.tsx            # 실제 영상 파일(MP4/WebM/MOV) 업로드 모달
│   │   ├── AdminLayout.tsx            # 관리자 전용 운영 콘솔 (/admin)
│   │   ├── MediaStorageManager.tsx    # S3/스토리지 실제 업로드 영상 자산 관리
│   │   ├── ProposalSampleView.tsx     # 관리자용 제안샘플 카드 관리 뷰
│   │   └── WhomediaLogo.tsx           # 후미디어 공식 브랜드 로고
│   ├── data/
│   │   ├── initialData.ts             # 초기화 데이터 (실제 업로드 영상만 보존)
│   │   └── projectData.ts             # 경희사이버대학교 기본 프로젝트 구조
│   └── utils/
│       ├── s3Storage.ts               # S3 Presigned URL 업로드 유틸
│       └── firebaseStore.ts           # Firestore 데이터 동기화
```

---

## 6. 개발 및 코드 작성 규칙

1. **심사위원 뷰 무결성 검증**:
   - URL에 `?p=khcu`나 대학 슬러그가 전달되면 `isAdminMode`는 반드시 `false`로 유지되어야 합니다.
   - 관리자 전용 액션(`[동영상 업로드]`, `[제안서 제출용 QR·링크]`, `[제안샘플 등록]` 등)이 심사위원 화면에 노출되지 않도록 확인하십시오.
2. **가짜 목데이터 주입 금지**:
   - "데모용"이라며 소스코드에 임의의 외부 영상 URL(Google bucket mp4 등)을 하드코딩하지 마십시오. 오직 사용자가 직접 업로드한 파일만 다룹니다.
3. **코드 변경 후 반드시 빌드 검증**:
   - 작업 후 항상 `npm run build`를 실행하여 컴파일 에러가 없는지 확인하십시오.
