# 강의 영상 검수 워크스페이스

기존 영상 검수 화면을 모양만 재현하는 대신, 실제 프로젝트·차시·영상 메타데이터와 원본 파일을 연결하는 React/Vite 앱입니다. Firestore에는 프로젝트와 검수 기록을 저장하고, 영상 원본은 S3 presigned URL로 업로드·재생합니다.

## 주요 흐름

- 프로젝트, 주차, 차시를 등록하고 실제 영상 파일 또는 외부 영상 링크를 연결합니다.
- 검수 창에서 영상 재생, 타임코드 의견, 승인 상태, 자막 편집과 SRT/VTT 내보내기를 처리합니다.
- 영상 창에서 만든 공유 링크는 영상 ID 하나만 포함합니다. 링크를 열면 전체 프로젝트 목록 없이 그 영상만 검수하는 화면이 표시되고, 선택한 재생 시점이 URL에 보존됩니다.
- AI 자막 분석은 실제 영상 파일을 Gemini에 보내 한국어 전사, 영문 번역, 타임코드, 요약, 핵심 용어와 불확실 구간을 반환합니다. 영상 제목으로 자막을 대신 만들어내지 않습니다.

## 로컬 실행

```bash
npm install
Copy-Item .env.example .env
# .env에 GEMINI_API_KEY를 입력합니다.
npm run dev
```

Vite 개발 서버의 `/api/ai/subtitles` 미들웨어는 Vercel과 같은 API 함수를 호출합니다. Gemini 키는 서버 환경 변수 `GEMINI_API_KEY`로만 설정하고 `VITE_` 접두사를 붙이지 마세요.

## 배포 설정

Vercel 프로젝트에 저장소를 연결하고 다음 환경 변수를 서버 측에 설정합니다.

- `GEMINI_API_KEY`: AI 자막 분석에 필요한 Gemini API 키
- `GEMINI_MODEL`: 선택 항목. 기본값은 `gemini-3.8-flash`
- `S3_PRESIGN_API_BASE`: 선택 항목. 기존 S3 presign API를 대체할 때 사용

Firebase 웹 설정은 공개 클라이언트 설정이며 기본값이 `src/utils/firebaseConfig.ts`에 있습니다. 다른 Firebase 프로젝트를 사용하면 `.env`에 `VITE_FIREBASE_*` 설정을 넣을 수 있습니다. Firestore 보안 규칙과 S3 CORS/권한은 해당 프로젝트의 운영 정책에 맞춰 관리해야 합니다.

## 영상 AI 분석 동작

1. 브라우저에서 영상 원본을 기존 S3 presign API에 업로드합니다.
2. Vercel API 함수가 S3 다운로드 URL로 원본을 읽어 Gemini Files API에 전달합니다.
3. Gemini 백그라운드 영상 분석을 폴링하고 결과를 검증한 뒤 Firestore의 `subtitleVtt`, `subtitles`, `aiAnalysis` 필드에 저장합니다.
4. 분석에 실패하면 자막을 새로 만들거나 승인 상태를 바꾸지 않고 오류를 표시합니다.

AI 결과는 강의 음질, 화자 겹침, 전문 용어에 따라 틀릴 수 있으므로 검수 창에서 원본 영상과 타임코드를 대조해 수정한 뒤 확정하세요.
