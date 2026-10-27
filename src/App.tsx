import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { UserHeader } from './components/UserHeader';
import { VideoTable } from './components/VideoTable';
import { AdminLayout } from './components/AdminLayout';
import { ReviewModal } from './components/ReviewModal';
import { UploadModal } from './components/UploadModal';
import { ShareModal } from './components/ShareModal';
import { ShieldCheck, Cloud, Sparkles, LayoutDashboard } from 'lucide-react';

const RootContent: React.FC = () => {
  const { portalMode, setPortalMode } = useApp();

  if (portalMode === 'admin') {
    return (
      <>
        <AdminLayout />
        {/* Global Modals available in Admin mode */}
        <ReviewModal />
        <UploadModal />
        <ShareModal />
      </>
    );
  }

  // ================= USER REVIEW PORTAL (MINIMALIST & REFERENCE-AUTHENTIC) =================
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      <UserHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        <VideoTable />
      </main>

      {/* Global Modals for User QA Playback and Upload */}
      <ReviewModal />
      <UploadModal />
      <ShareModal />

      {/* Quiet, clean footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">AI와 함께 쓰는 스토리텔링 워크숍</span>
            <span aria-hidden="true">·</span>
            <span>사내 영상 품질검수 포털</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPortalMode('admin')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>관리자 전용 콘솔 접속 (Admin URL: ?portal=admin)</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <RootContent />
    </AppProvider>
  );
}
