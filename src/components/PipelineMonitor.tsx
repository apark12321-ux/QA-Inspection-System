import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Server,
  Cpu,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';

export const PipelineMonitor: React.FC = () => {
  const { videos, triggerSimulatedPipeline, setSelectedVideo } = useApp();
  const [selectedJobId, setSelectedJobId] = useState<string>(videos[1]?.pipeline?.jobId || '');

  const activeVideos = videos.filter(v => v.pipeline);
  const selectedVideo = videos.find(v => v.pipeline?.jobId === selectedJobId) || activeVideos[0];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>실시간 영상 처리 파이프라인 모니터링 (AWS Serverless)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            S3 멀티파트 업로드, AWS MediaConvert 트랜스코딩, Gemini 3.8 Flash 자막 생성 단계를 실시간으로 추적합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            파이프라인 정상 가동 중
          </span>
        </div>
      </div>

      {/* Main Grid: Job Selector (Left) & Pipeline Stages Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active Video Jobs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>미디어 잡 목록 ({activeVideos.length})</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {activeVideos.map(v => (
              <div
                key={v.id}
                onClick={() => setSelectedJobId(v.pipeline.jobId)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedVideo?.id === v.id ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-slate-800 truncate">
                    {v.fileName}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      v.status === 'PROCESSING'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {v.pipeline.overallProgress}%
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 truncate">{v.sessionTitle}</p>

                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      v.pipeline.overallProgress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${v.pipeline.overallProgress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Selected Job Pipeline Detail */}
        {selectedVideo && (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Job Summary Banner */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-base font-bold text-slate-900">
                      {selectedVideo.fileName}
                    </h3>
                    <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      Job ID: {selectedVideo.pipeline.jobId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {selectedVideo.weekTitle} · {selectedVideo.sessionTitle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => triggerSimulatedPipeline(selectedVideo.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    title="파이프라인 재실행"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>재실행</span>
                  </button>

                  <button
                    onClick={() => setSelectedVideo(selectedVideo)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>검수 플레이어 열기</span>
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>전체 파이프라인 진행률: {selectedVideo.pipeline.currentStage}</span>
                  <span className="font-mono text-blue-600">{selectedVideo.pipeline.overallProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedVideo.pipeline.overallProgress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${selectedVideo.pipeline.overallProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Step-by-Step Serverless Stages */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>AWS 서버리스 단계별 실행 세부 정보</span>
              </h4>

              <div className="space-y-4">
                {selectedVideo.pipeline.stages.map((stage, idx) => (
                  <div
                    key={stage.name}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {stage.status === 'done' ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : stage.status === 'active' ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : (
                          <Clock className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">0{idx + 1}.</span>
                          <span className="text-sm font-bold text-slate-900">{stage.name}</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              stage.status === 'done'
                                ? 'bg-emerald-100 text-emerald-800'
                                : stage.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {stage.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                      </div>
                    </div>

                    <div className="text-right sm:self-center shrink-0">
                      <span className="font-mono font-bold text-xs text-slate-700">{stage.progress}%</span>
                      {stage.timestamp && (
                        <div className="text-[11px] text-slate-400 font-mono">{stage.timestamp}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CloudWatch Simulated Worker Log Console */}
            <div className="bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-1 overflow-x-auto shadow-inner">
              <div className="flex items-center justify-between text-slate-500 border-b border-slate-800 pb-2 mb-2">
                <span className="flex items-center gap-1.5 text-slate-400 font-bold">
                  <Terminal className="w-3.5 h-3.5" /> Amazon CloudWatch Logs Stream
                </span>
                <span className="text-[11px]">/aws/lambda/video-pipeline-orchestrator</span>
              </div>
              <p className="text-emerald-400">[INFO] 2026-10-26T13:28:10Z S3:ObjectCreated:Put event received for key "uploads/{selectedVideo.fileName}"</p>
              <p className="text-slate-400">[INFO] 2026-10-26T13:28:12Z Invoking AWS Elemental MediaConvert Job {selectedVideo.pipeline.jobId}</p>
              <p className="text-slate-400">[INFO] 2026-10-26T13:31:05Z MediaConvert output profile: 1080p@6000kbps, 720p@2500kbps (H.264/AAC)</p>
              <p className="text-blue-400">[INFO] 2026-10-26T13:33:14Z Gemini 3.8 Flash STT response 200 OK. 12 Subtitle cues translated to EN.</p>
              <p className="text-emerald-400">[INFO] 2026-10-26T13:34:01Z Amazon DynamoDB record updated. Ready for QA Inspector queue.</p>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
