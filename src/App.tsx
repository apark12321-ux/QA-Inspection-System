import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { VideoTable } from './components/VideoTable';
import { AdminDashboard } from './components/AdminDashboard';
import { PipelineMonitor } from './components/PipelineMonitor';
import { UserManagement } from './components/UserManagement';
import { AuditLogView } from './components/AuditLogView';
import { AwsArchitectureView } from './components/AwsArchitectureView';
import { ReviewModal } from './components/ReviewModal';
import { UploadModal } from './components/UploadModal';
import { ShareModal } from './components/ShareModal';
import { ShieldCheck, Cloud, Sparkles } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {activeTab === 'list' && <VideoTable />}
      {activeTab === 'dashboard' && <AdminDashboard />}
      {activeTab === 'pipeline' && <PipelineMonitor />}
      {activeTab === 'rbac' && <UserManagement />}
      {activeTab === 'audit' && <AuditLogView />}
      {activeTab === 'aws' && <AwsArchitectureView />}

      {/* Global Modals */}
      <ReviewModal />
      <UploadModal />
      <ShareModal />
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
        <Header />
        
        <div className="flex-1">
          <MainContent />
        </div>

        {/* Quiet, clean footer adhering to Anti-Slop guidelines */}
        <footer className="bg-white border-t border-slate-200 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">AI와 함께 쓰는 스토리텔링 워크숍</span>
              <span aria-hidden="true">·</span>
              <span>사내 영상 품질검수 &amp; QA 파이프라인</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Cloud className="w-3 h-3 text-amber-500" /> AWS Serverless
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" /> Gemini 3.8 Flash
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> RBAC Enabled
              </span>
            </div>
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}
