# WHOMEDIA 인트라넷 & 검수 시스템 Pretendard 디자인 폰트 전면 적용 계획

사내 임직원 전용 인트라넷 허브 및 동영상 검수 시스템 전반에 프리미엄 한국어 서체인 **Pretendard(프리텐다드)**를 전면 도입하고, 첨부된 디자인 이미지의 시각적 위계(고대비 볼드 타이틀, 절제된 자간, 센터 정렬 레이아웃)를 완벽하게 반영합니다.

---

> [!IMPORTANT]
> ### 사용자 확인 및 결정 사항 요약
> - **적용 폰트 서체**: 최신 프리미엄 한국어 산세리프 서체인 **Pretendard(프리텐다드)** 가변/고대비 볼드(700~900) 전면 적용
> - **적용 범위**: 사내 인트라넷 카드 타이틀(직원 핸드북, 프로젝트 보고서, 채용 허브, 팀 업데이트 등)뿐만 아니라 시스템 본문, 헤더, 모달, 검수 플레이어 등 전 시스템 일괄 적용
> - **좌측 상단 로고 표기**: `(주)후미디어` 국문 표기를 완전히 제거하고, 세련된 `WHOMEDIA` 볼드 영문 브랜드 록업 및 닷 매트릭스 원형 심볼 유지

---

## 1. 개요 및 핵심 목표 (Overview & Core Concept)

- **목적**: 인트라넷 포털 홈 화면의 카드 타이포그래피를 첨부된 레퍼런스 이미지(굵고 명확하며 가독성 높은 기하학적 산세리프)와 1:1로 일치시키고, 영상 검수 시스템 내부 화면까지 일관된 폰트 아이덴티티를 구축합니다.
- **주요 대상**: 매일 강의 영상을 검수하고 사내 도구를 사용하는 사내 임직원 및 검수자.
- **핵심 가치**: 저해상도 디스플레이 및 다크 모드 환경에서도 글자의 뭉개짐 없이 선명한 가독성을 제공하는 글리프 힌팅 최적화 달성.

---

## 2. 사용자 경험 및 시각 디자인 (UX & Visual Design)

### A. 폰트 서체 및 타이포그래피 계층 (Pretendard Integration)
- **웹폰트 로드**: `index.html`에 경량화된 고속 Pretendard Variable 웹폰트(`https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css`) CDN 로드 및 로컬 폴백(`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) 구성.
- **카드 타이틀 타이포그래피**:
  - 참고 이미지의 `직원 핸드북`, `프로젝트 보고서`, `채용 허브`, `팀 업데이트`, `연례 보고서`, `새로운 서비스`, `사내 문화` 카드의 폰트 렌더링을 `font-black` (weight 800~900), `text-[24px]`~`text-[28px]`, `tracking-tight` (-0.03em), `leading-[1.25]`로 조정.
  - 다크 테마 카드: 핫핑크/네온 마젠타 외곽선 안쪽에 순백색(`text-white`) 볼드 텍스트를 배치하여 눈에 즉각 들어오는 인지성 확보.
  - 라이트 테마 카드: 순백색 솔리드 배경 위에 딥 다크 잉크(`text-[#0f0b18]`) 볼드 텍스트 및 우측 상단 핑크 `⊕` 원형 뱃지 일치.
- **전역 본문 및 UI 폰트**:
  - `src/index.css`의 글로벌 폰트 패밀리를 `font-family: 'Pretendard Variable', 'Pretendard', sans-serif;`로 지정.
  - 본문 최소 폰트 크기를 `15px` 이상으로 유지하고 행간(`leading-relaxed`)을 최적화하여 장시간 검수 시 눈의 피로도 대폭 경감.

### B. 뷰포트 및 레이아웃 연동
- 사내 포털 홈(`IntranetPortalHome.tsx`)과 메인 앱 셸(`App.tsx`), 비디오 검수 테이블(`VideoTable.tsx`)의 내비게이션 전환이 매끄럽게 연결되도록 구성.
- 좌측 상단 로고: `(주)후미디어` 없는 깔끔한 `WHOMEDIA · 영상 검수 시스템` 볼드 록업 유지.

---

## 3. 주요 결정 사항 및 기술적 고려 (Product Decisions & Trade-Offs)

| 항목 | 선택된 방식 | 선택 이유 및 대안 대비 장점 |
|---|---|---|
| **폰트 공급 방식** | Pretendard Variable CDN + WOFF2 | 기존 노토산스 대비 한글 자모 밸런스가 뛰어나고 파일 용량이 가벼우며, 100~900 가변 웨이트 지원으로 카드 타이틀의 고대비 볼드를 완벽하게 표현 |
| **글로벌 적용 방식** | Tailwind CSS `font-sans` 전역 바인딩 | 개별 요소에 인라인 스타일을 반복하지 않고, Tailwind 빌드 시스템과 완벽하게 통합되어 일관성 및 유지보수성 극대화 |
| **사내 도구 확장성** | `새로운 서비스` 모달 연동 유지 | "툴을 하나씩 얹어가려고 함" 요구사항에 부합하도록 직원이 직접 새 도구를 등록하고 관리할 수 있는 인터랙티브 모달 지원 |

---

## 4. 시스템 아키텍처 및 컴포넌트 계층 (Technical Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                       index.html                            │
│  - Pretendard Variable CDN link (weights 100-900)           │
│  - Global CSS with font-family: Pretendard, sans-serif      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
   ┌───────────────────────────┐ ┌───────────────────────────┐
   │    IntranetPortalHome     │ │       App Shell           │
   │ - Pretendard Black 타이틀 │ │ - Pretendard 본문 (15px+) │
   │ - 4열 반응형 카드 그리드   │ │ - 좌측 사이드바 & 탑바     │
   │ - 네온 마젠타 & 화이트 카드│ │ - WHOMEDIA 볼드 로고      │
   │ - 신규 툴 등록 모달 연동   │ │ - 검수 / 프로젝트 관리 뷰  │
   └────────────┬──────────────┘ └─────────────┬─────────────┘
                │                             │
                └──────────────┬──────────────┘
                               ▼
                ┌─────────────────────────────┐
                │        AppContext           │
                │ - userViewMode ('portal' 등)│
                │ - projects, videos, tools   │
                └─────────────────────────────┘
```

---

## 5. 실행 및 검증 절차

1. **`index.html` 폰트 CDN 갱신**:
   - Pretendard Variable CSS 링크 삽입 및 meta 정보 동기화.
2. **`src/index.css` 글로벌 타이포그래피 정의**:
   - 기본 `font-family`를 Pretendard로 설정하고 자간, 행간, 안티앨리어싱(`-webkit-font-smoothing: antialiased`) 적용.
3. **`IntranetPortalHome.tsx` 카드 텍스트 스타일 정밀 튜닝**:
   - 참고 이미지 비율에 맞춰 폰트 웨이트, 크기, 센터 패딩, ⊕ 뱃지 위치 디테일 보정.
4. **전체 컴포넌트 폰트 검수**:
   - `VideoTable`, `ReviewModal`, `ProjectRegistrationView`, `AdminLayout`의 텍스트가 깨짐 없이 Pretendard로 매끄럽게 렌더링되는지 확인.
5. **빌드 및 린트 검증**:
   - `lint_applet` (`tsc --noEmit`) 0건 통과 확인.
   - `compile_applet` (`vite build`) 프로덕션 빌드 성공 확인.
