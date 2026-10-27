# Navigation & Portal Separation Architecture (사용자 검수 포털 & 관리자 콘솔 분리)

Restructuring the enterprise video review portal into two strictly segregated, purpose-built environments:
1. **User Review Portal (사용자 검수 포털)**: A distraction-free, reference-authentic workspace designed exclusively for QA reviewers, creators, and viewers featuring only the lecture video table, search/filters, and the frame-accurate review modal.
2. **Admin Management Console (관리자 전용 콘솔, `/admin`)**: An executive command center containing the QA analytics dashboard, real-time AWS serverless pipeline monitoring, RBAC user permissions, audit trails, and cloud architecture blueprints.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed through Phase 1 clarification:
> - **Dedicated Routing & Portal Separation**: The application will feature dual routing (`/` or `mode=review` for standard users, and `/admin` or `mode=admin` for managers), ensuring normal users never see irrelevant admin tabs or system clutter.
> - **Distraction-Free User Viewport**: Reviewers and creators will experience a 100% focused UI matching the reference `video-review-e102e.web.app` layout (header brand title, search filter, lecture session table, and review modal).
> - **Verified Admin Access Switcher**: Authorized staff can transition seamlessly into the Admin Console via a role-verified switcher or direct `/admin` URL, with quick 1-click return to the review portal.

---

### 1. Overview & Core Concept

- **What It Does**:
  - **General Workspace (`/`)**: Displays the clean project header "AI와 함께 쓰는 스토리텔링 워크숍", session search/filters, the lecture list with status pills, and the video inspection modal with playback controls and timecode feedback.
  - **Admin Console (`/admin`)**: A dedicated administration suite featuring a persistent enterprise sidebar navigation with Dashboard, Pipeline Monitor, RBAC & Users, Audit Logs, and AWS Architecture tabs.
- **Target Audience / Persona**:
  - **Reviewers & Creators**: Work in the streamlined review portal without administrative distraction.
  - **Admins & Team Leads**: Access the full administration suite to inspect metrics, monitor transcode pipelines, adjust user roles, and export audit trails.

---

### 2. User Experience & Visual Design

#### Navigation Structure

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Enterprise Architecture                         │
├───────────────────────────────────┬────────────────────────────────────┤
│  A. User Review Portal (`/`)      │  B. Admin Console (`/admin`)       │
│  - Clean Top Bar (Brand + Search) │  - Sidebar Nav + Top Breadcrumb    │
│  - Minimalist 1-Row Table View    │  - Analytics Dashboard (KPIs, CSV) │
│  - Video Inspection Modal (QA)    │  - Real-Time Transcoding Pipeline  │
│  - AI Subtitle & Translation Tab  │  - User & RBAC Permissions Matrix  │
│  - Creator Video Upload           │  - Security Audit Trail (Logs)     │
│  - [관리자 콘솔 바로가기] (Admin) │  - AWS Serverless Architecture     │
│                                   │  - [검수 포털로 돌아가기] CTA       │
└───────────────────────────────────┴────────────────────────────────────┘
```

#### User Experience Flows
1. **User Portal Flow (`/`)**:
   - Header shows project title `AI와 함께 쓰는 스토리텔링 워크숍`, language toggle (KO/EN), notification center, and active reviewer profile.
   - If the current user has `ADMIN` privileges, a discreet button `[관리자 콘솔 이동 ↗]` appears in the header or footer.
   - Zero admin clutter (no tabs for pipeline, audit logs, or cloud architecture).
2. **Admin Console Flow (`/admin`)**:
   - Left sidebar navigation (240px) with icons for:
     - 📊 `대시보드 (Dashboard)`
     - ⚡ `처리 파이프라인 (Pipeline)`
     - 🛡️ `권한 관리 (RBAC & Users)`
     - 📜 `활동 로그 (Audit Logs)`
     - ☁️ `AWS 아키텍처 (AWS Serverless)`
     - 🎬 `검수 포털로 복귀 (Back to QA Portal)`
   - Non-admin users attempting to enter `/admin` receive a role verification prompt with option to switch to an Admin account.

---

### 3. Key Product Decisions & Trade-Offs

- **URL-Driven Routing vs. State-Only Tabs**:
  - *Chosen Approach*: URL sync (`/` vs `/admin`, with fallback to `?portal=admin` or query parameter synchronization).
  - *Why*: Allows bookmarking, direct administrative linking, and prevents cognitive overload for reviewers who only need to review videos.
- **Role Guarding**:
  - *Chosen Approach*: Automatic role check. If user is in `REVIEWER` or `VIEWER` role and visits `/admin`, an informative access banner is displayed with a quick role verification toggle.

---

### 4. Technical Architecture & Component Mapping

```
┌────────────────────────────────────────────────────────────────────────┐
│                            App Root (App.tsx)                          │
├───────────────────────────────────┬────────────────────────────────────┤
│ Route / Mode Detection            │ Reads pathname or searchParams     │
│ (portalMode: 'user' | 'admin')    │ Synchronizes with window.history   │
├───────────────────────────────────┴────────────────────────────────────┤
│  IF portalMode === 'user':                                             │
│    ├── UserHeader (Minimal reference header with project branding)     │
│    ├── VideoTable (Reference lecture list, filters, & play buttons)    │
│    └── Modals (ReviewModal, UploadModal, ShareModal)                   │
├────────────────────────────────────────────────────────────────────────┤
│  IF portalMode === 'admin':                                            │
│    ├── AdminLayout (Sidebar + Breadcrumb Top Bar)                      │
│    ├── Active Admin Section (Dashboard | Pipeline | RBAC | Audit | AWS)│
│    └── Role Verification Guard                                         │
└────────────────────────────────────────────────────────────────────────┘
```
