# Enterprise Video Review & Inspection Platform (동영상 검수 포털)

A high-performance enterprise video review, QA inspection, and automated workflow system inspired by `video-review-e102e.web.app` and modernized with an executive admin dashboard, real-time video pipeline monitoring, role-based access control (RBAC), AI-powered automated captioning & translation, drag-and-drop video uploading, offline local caching, and deep-linked review sharing.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions have been confirmed through Phase 1 clarification:
> - **Authentication & Roles**: A prominent, quick-access Role Switcher (Admin 관리자, Reviewer 검수자, Creator 제작자, Viewer 뷰어) is integrated directly into the workspace header for rapid testing, complete with granular permission gates for editing reviews, uploading, and managing users.
> - **AI Subtitles & Translation**: Gemini 3.8 Flash powers automatic audio/speech transcript extraction and high-accuracy English translation with interactive timestamp synchronization.
> - **Sample & Upload Strategy**: Initialized with rich, realistic enterprise lecture series (7 sample videos with realistic inspection statuses, timestamps, and feedback history) alongside full drag-and-drop custom video file uploading.
> - **Architecture**: Client-side state engine with IndexedDB persistence, Service Worker offline caching, and simulated AWS serverless architecture (API Gateway, Lambda, S3, EventBridge, CloudWatch) with interactive cloud telemetry and pipeline visualizer.

---

### 1. Overview & Core Concept

- **What It Does**: Provides a unified corporate web application for reviewing instructional and corporate videos. Team members can inspect video playback at various speeds (0.5x to 2x) with ±10s scrubbing, record time-stamped inspection feedback (with status: Approval 승인 / Rejection 반려 / Pending 대기), generate AI subtitles and translations on the fly, monitor batch video processing pipelines, and inspect audit logs.
- **Target Audience / Persona**:
  - **Reviewers (검수자)**: Educational content directors and quality assurance managers inspecting lecture cuts, noting audio/visual glitches, subtitle errors, or pacing issues.
  - **Creators/Producers (제작자)**: Video editors and animators uploading draft lectures, reviewing actionable feedback timecodes, and uploading revisions.
  - **Admins (관리자)**: Team leads tracking overall project completion rates, reviewer turnaround time, batch export status, and system audit logs.
  - **Viewers (게스트/뷰어)**: Stakeholders with read-only access to approved materials and shareable deep links.
- **Key Value**: Replaces chaotic email/chat review threads with frame-precise, time-coded actionable feedback, reducing review turnaround by over 60% with integrated AI translation and automated pipeline alerts.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Browse & Filter (차시 목록 탐색)**:
   - Users view the project's video series grouped by Week (주차) and Lecture Session (차시명) with file details, status tags (승인 완료, 검수 반려, 검수 대기, 처리 중), reviewer name, and registration dates.
   - Real-time search filters by project name, session title, file name, or review state.
2. **Video Inspection & Feedback (동영상 검수 모달)**:
   - Clicking `재생` opens the high-precision review modal faithfully matching the reference screenshot:
     - Left: 16:9 video player with custom video controls, ±10s skip buttons, speed multiplier tabs (0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x), and current/total duration (`00:08 / 12:29`).
     - Right: Inspection console with reviewer name input, 3-state verdict buttons (승인 [Green], 반려 [Red], 대기로 [Slate]), timecode-linked feedback textarea, "현재 재생 시점 담기" checkbox, and a chronological list of stamped inspection notes with one-click timestamp seeking.
     - Footer: Rich metadata pill row with file size, upload timestamp, week/session path.
3. **AI Captioning & Translation Studio (AI 자막 및 번역 도구)**:
   - One-click "AI 자막 생성" button sends video speech context to Gemini to extract precise time-synced subtitles.
   - Dual-track subtitle preview (Original Korean & Translated English) with export options (.SRT / .VTT / JSON).
4. **Admin Dashboard & Pipeline Monitoring (관리자 대시보드 & 처리 현황)**:
   - Executive metrics: Overall inspection rate, Approval vs. Rejection ratio, Reviewer activity leaderboard, and Average turnaround.
   - Real-time video processing pipeline tracker (Upload -> S3 -> MediaConvert / Transcoding -> AI Audio Analysis -> Ready for QA).
   - Audit trail log table recording every action (login, status change, comment added, file uploaded) with search and CSV export.
5. **Drag-and-Drop Video Uploader (동영상 업로드)**:
   - Full drag-and-drop dropzone supporting MP4/WebM/MOV with automatic duration, resolution, and file size detection.
6. **Shareable Link & Offline Mode (공유 링크 및 오프라인 모드)**:
   - Share modal generating deep links with embedded timestamp (`?v=26story01_02_04&t=192`).
   - Offline indicator with local IndexedDB storage, enabling seamless reviewing even without internet connectivity.

#### Visual Identity & Theme
- **Aesthetic Direction**: Utilitarian, clean corporate software inspired by modern broadcast and EdTech portals (clean borders, crisp tabular numbers, zero unnecessary fluff).
- **Color Palette**:
  - Dominant Neutral Canvas: `#F8FAFC` (Slate 50) and `#0F172A` (Slate 900 for dark/player mode).
  - Structural Surfaces: Pure White `#FFFFFF` and crisp 1px borders `#E2E8F0` (Slate 200).
  - Semantic Status Tokens:
    - Approval (승인): `#16A34A` (Emerald 600)
    - Rejection (반려): `#DC2626` (Red 600)
    - Pending (대기): `#475569` (Slate 600)
    - Primary Interactive Accent: `#2563EB` (Blue 600)
- **Typography & Hierarchy**:
  - Display & Body: `Plus Jakarta Sans` and Korean system font fallback (`Pretendard`, `Apple SD Gothic Neo`, sans-serif).
  - Timestamps, durations, and metrics: Tabular figures (`tabular-nums font-mono`).
- **Responsive Architecture**:
  - Desktop (1440px): Split side-by-side video and QA form layout inside modal.
  - Tablet/Mobile: Stacked responsive layout with collapsible drawer for review notes and touch-friendly playback scrubbing.

---

### 3. Key Product Decisions & Trade-Offs

- **Role Switcher vs. Credential Login**:
  - *Chosen Approach*: Instant top-bar Role Switcher toggle with active role pill and persistent state.
  - *Why*: Allows immediate, frictionless demonstration and QA of permission-restricted features without needing multi-account signups.
- **Client Storage & Offline Resilience (IndexedDB + Service Worker)**:
  - *Chosen Approach*: Dual-layer persistence using `idb-keyval` / localStorage with Service Worker caching.
  - *Why*: Supports offline review mode as requested by user, instant persistence without external cloud database latency, and smooth offline replay of preloaded videos.
- **AWS Serverless Architecture Blueprint & Live Telemetry Emulator**:
  - *Chosen Approach*: Faithful AWS Serverless architectural design (CloudFront -> S3 Bucket -> S3 Event -> Lambda Transcoder & Rekognition/Gemini -> DynamoDB -> API Gateway) reflected both in an interactive architecture tab and the real-time processing status monitor.
  - *Why*: Fulfills the user's AWS serverless architectural requirement with realistic operational simulation and exportable CloudFormation/SAM configuration.
- **AI Model Selection**:
  - *Chosen Approach*: `gemini-3.8-flash` via `@google/genai`.
  - *Why*: Optimal latency, zero billing friction for standard development keys, and high accuracy in Korean and English audio/script reasoning.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Enterprise Video Review UI                      │
├──────────────────┬───────────────────┬─────────────────────────────────┤
│ Top Bar Contract │ Brand & Project   │ Quick Role Switcher (Admin/...) │
│ & Navigation     │ Breadcrumbs       │ Language Switcher (KO / EN)     │
├──────────────────┴───────────────────┴─────────────────────────────────┤
│ Navigation Tabs: [검수 목록 (QA List)] [관리자 대시보드 (Dashboard)]   │
│                  [처리 파이프라인 (Pipeline)] [활동 로그 (Audit Logs)] │
│                  [업로드 (Upload)] [AWS 아키텍처 (Architecture)]       │
├────────────────────────────────────────────────────────────────────────┤
│                          Active View Canvas                            │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │ Video Table & Filter Toolbar  │  │ Interactive Review Modal       │ │
│  │ - Search & Category Filter    │  │ - 16:9 Video Canvas w/ Scrub   │ │
│  │ - Week / Session Data Rows    │  │ - Speed Tabs (0.5x - 2.0x)     │ │
│  │ - Status Pills & Play Action  │  │ - Timecode Feedback Form       │ │
│  │                               │  │ - AI Caption & Translation Tab │ │
│  └───────────────────────────────┘  └────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│                     Local Engine & Mock AWS Services                   │
│  ┌───────────────────────┐ ┌──────────────────┐ ┌────────────────────┐ │
│  │ IndexedDB / LocalSync │ │ Audit Logger     │ │ Notification Engine│ │
│  │ - Videos & Reviews    │ │ - User actions   │ │ - Toast & History  │ │
│  └───────────────────────┘ └──────────────────┘ └────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Gemini 3.8 Flash Client (AI Subtitles & English Translation)      │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key Data Models
1. **VideoSession**:
   - `id`: string
   - `weekTitle`: string (e.g., 'AI 시대, 새로운 스토리텔링의 문법')
   - `sessionTitle`: string (e.g., '이야기의 뼈대와 모티프(Motif)')
   - `fileName`: string (e.g., '26story01_02_04.mp4')
   - `url`: string (video stream/blob URL)
   - `duration`: number (in seconds)
   - `fileSize`: string (e.g., '260 MB')
   - `status`: 'APPROVED' | 'REJECTED' | 'PENDING' | 'PROCESSING'
   - `createdAt`: string
   - `reviews`: ReviewComment[]
   - `subtitles`: SubtitleEntry[]
   - `pipeline`: { step: string; progress: number; status: 'completed' | 'running' | 'queued' }
2. **ReviewComment**:
   - `id`: string
   - `author`: string
   - `role`: string
   - `timestampSeconds`: number
   - `timestampFormatted`: string (e.g., '03:12')
   - `verdict`: 'APPROVED' | 'REJECTED' | 'PENDING'
   - `content`: string
   - `createdAt`: string
3. **AuditLog**:
   - `id`: string
   - `actor`: string
   - `role`: string
   - `action`: string
   - `target`: string
   - `timestamp`: string
   - `details`: string
4. **Notification**:
   - `id`: string
   - `type`: 'approval' | 'rejection' | 'comment' | 'pipeline'
   - `title`: string
   - `body`: string
   - `read`: boolean
   - `timestamp`: string
