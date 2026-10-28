import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatTime } from '../utils/formatters';
import {
  HardDrive,
  Cloud,
  Upload,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Play,
  FileVideo,
  Shield,
  Layers,
  Search,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap
} from 'lucide-react';

export const MediaStorageManager: React.FC = () => {
  const {
    videos,
    deleteVideo,
    setSelectedVideo,
    setUploadModalOpen,
    triggerSimulatedPipeline,
    addAuditLog
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [invalidationStatus, setInvalidationStatus] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Record<string, string>>({});
  const [activeSubTab, setActiveSubTab] = useState<'files' | 'serverConfig'>('files');

  // CDN & Storage Settings States
  const [presignedTtl, setPresignedTtl] = useState(60);
  const [glacierDays, setGlacierDays] = useState(30);
  const [hlsProfiles, setHlsProfiles] = useState({
    p1080: true,
    p720: true,
    p480: false
  });
  const [configSaved, setConfigSaved] = useState(false);

  // Storage metrics calculation
  const totalMb = useMemo(() => {
    return videos.reduce((acc, v) => {
      const match = v.fileSize.match(/(\d+)/);
      return acc + (match ? parseInt(match[1], 10) : 200);
    }, 0);
  }, [videos]);

  const totalGb = (totalMb / 1024).toFixed(2);
  const storageQuotaGb = 100;
  const usagePercentage = Math.min(100, Math.round((totalMb / (storageQuotaGb * 1024)) * 100));

  const filteredVideos = useMemo(() => {
    return videos.filter(v =>
      searchQuery === '' ||
      v.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.weekTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.sessionTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [videos, searchQuery]);

  const handleCopyCdnUrl = (v: typeof videos[0]) => {
    const cdnUrl = `https://d3a4b5c6d7e8.cloudfront.net/media/${v.fileName}`;
    navigator.clipboard.writeText(cdnUrl);
    setCopiedId(v.id);
    addAuditLog('CDN_URL_COPIED', v.fileName, 'CloudFront CDN 스트리밍 주소 복사');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInvalidateCache = (fileName: string) => {
    setInvalidationStatus(`CloudFront 캐시 무효화 요청 전송: /media/${fileName}*`);
    addAuditLog('CDN_CACHE_INVALIDATE', fileName, 'CloudFront 엣지 캐시 무효화 (Invalidation) 실행');
    setTimeout(() => {
      setInvalidationStatus(`✓ 캐시 무효화 완료: /media/${fileName}* (배포 상태 정상)`);
      setTimeout(() => setInvalidationStatus(null), 3000);
    }, 1500);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaved(true);
    addAuditLog('STORAGE_CONFIG_UPDATED', 'S3/CDN', `Presigned TTL ${presignedTtl}분, Glacier ${glacierDays}일`);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            <span>영상 저장소 및 미디어 서버 관리 (Media Storage & CDN)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            AWS S3 영상 원본 버킷, CloudFront CDN 스트리밍 배포, 트랜스코딩 해상도 프로파일 및 파일 보관 정책을 총괄 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* SubTab switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveSubTab('files')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                activeSubTab === 'files' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              영상 파일 자산 목록
            </button>
            <button
              onClick={() => setActiveSubTab('serverConfig')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
                activeSubTab === 'serverConfig' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>서버 및 버킷 설정</span>
            </button>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>+ 새 영상 업로드</span>
          </button>
        </div>
      </div>

      {/* CloudFront Invalidation Alert Notice */}
      {invalidationStatus && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Zap className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{invalidationStatus}</span>
        </div>
      )}

      {/* KPI Cards: S3 Bucket, Usage, CDN Distribution, MediaConvert Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* S3 Storage Quota */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">S3 버킷 사용량</span>
            <HardDrive className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalGb} GB <span className="text-xs font-normal text-slate-400">/ 100 GB</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(4, usagePercentage)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
            <span>서울(ap-northeast-2)</span>
            <span className="font-mono">{usagePercentage}% 할당</span>
          </div>
        </div>

        {/* Total Video Files */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">보관 영상 자산</span>
            <FileVideo className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {videos.length} <span className="text-xs font-normal text-slate-400">개 마스터 파일</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            1080p / 720p ABR 트랜스코딩 14개 스트림 보관
          </div>
        </div>

        {/* CloudFront CDN Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">CloudFront CDN</span>
            <Cloud className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Deployed (Active)</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1 truncate" title="d3a4b5c6d7e8.cloudfront.net">
            d3a4b5c6d7e8.cloudfront.net
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            엣지 캐시 적중률: 94.2%
          </div>
        </div>

        {/* Security & Access */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">보안 및 서명 만료</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900">
            {presignedTtl} <span className="text-xs font-normal text-slate-500">분 Presigned URL</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5">
            외부 무단 다운로드 방지 토큰 암호화 활성
          </div>
        </div>

      </div>

      {activeSubTab === 'files' ? (
        /* Video Assets File Management View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Table Header & Search */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                S3 버킷 및 CDN 비디오 자산 라이브러리 ({filteredVideos.length})
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                s3://cau-storytelling-media-storage/
              </span>
            </div>

            <div className="relative sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="파일명, 주차명, 차시명 검색..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Files Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">동영상 파일명</th>
                  <th className="py-3 px-4">강의 차시 정보</th>
                  <th className="py-3 px-4">파일 크기 / 길이</th>
                  <th className="py-3 px-4">인코딩 프로파일</th>
                  <th className="py-3 px-4">스토리지 티어</th>
                  <th className="py-3 px-4 text-right">서버 및 파일 제어</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVideos.map(video => {
                  const currentClass = selectedClass[video.id] || 'S3 Standard';

                  return (
                    <tr key={video.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* 파일명 */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileVideo className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate max-w-[200px]">{video.fileName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 font-mono">
                          등록: {video.uploadedAt}
                        </div>
                      </td>

                      {/* 연결 차시 */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-semibold text-slate-900 truncate max-w-[220px]">
                          {video.sessionTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                          {video.weekTitle}
                        </div>
                      </td>

                      {/* 크기 및 시간 */}
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-800">
                        <span className="font-bold">{video.fileSize}</span>
                        <div className="text-[11px] text-slate-400">
                          {formatTime(video.duration)} (약 {Math.round(video.duration / 60)}분)
                        </div>
                      </td>

                      {/* 인코딩 프로파일 */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            1080p ABR
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            720p
                          </span>
                        </div>
                      </td>

                      {/* 스토리지 클래스 */}
                      <td className="py-3.5 px-4">
                        <select
                          value={currentClass}
                          onChange={e => {
                            const val = e.target.value;
                            setSelectedClass(prev => ({ ...prev, [video.id]: val }));
                            addAuditLog('STORAGE_CLASS_CHANGED', video.fileName, `스토리지 클래스를 ${val}(으)로 변경`);
                          }}
                          className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="S3 Standard">S3 Standard (실시간)</option>
                          <option value="Intelligent-Tiering">Intelligent-Tiering (비용최적화)</option>
                          <option value="Glacier Instant">S3 Glacier (아카이브)</option>
                        </select>
                      </td>

                      {/* 서버 액션 버튼들 */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* CDN 링크 복사 */}
                          <button
                            onClick={() => handleCopyCdnUrl(video)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="CloudFront CDN HLS 스트리밍 링크 복사"
                          >
                            {copiedId === video.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* CDN 캐시 무효화 */}
                          <button
                            onClick={() => handleInvalidateCache(video.fileName)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                            title="CloudFront 엣지 캐시 무효화 (Invalidation)"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          {/* 재인코딩 */}
                          <button
                            onClick={() => triggerSimulatedPipeline(video.id)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="AWS MediaConvert 트랜스코딩 재실행"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          {/* 플레이어로 열기 */}
                          <button
                            onClick={() => setSelectedVideo(video)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="검수 플레이어 실행"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          {/* 삭제 */}
                          <button
                            onClick={() => {
                              if (confirm(`'${video.fileName}' 영상 파일을 S3 저장소 및 시스템에서 완전히 삭제하시겠습니까?`)) {
                                deleteVideo(video.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="S3 버킷 및 메타데이터 영구 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              * CloudFront CDN 링크 복사 시 보안 토큰이 포함된 유효한 HLS 스트림 URL이 클립보드에 복사됩니다.
            </div>
            <div className="font-mono text-slate-400">
              Total Storage: {totalGb} GB / 7 Assets
            </div>
          </div>

        </div>
      ) : (
        /* Video Server & S3 Storage Configuration View */
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>AWS S3 저장소 및 CloudFront CDN 서버 운영 정책</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              동영상 업로드 Presigned URL의 유효 시간, 자동 아카이브 수명주기(Lifecycle) 및 트랜스코딩 비트레이트를 구성합니다.
            </p>
          </div>

          {configSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>스토리지 및 미디어 서버 설정이 성공적으로 저장되었습니다.</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-6 max-w-3xl">
            
            {/* 1. Presigned URL TTL */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Presigned URL 보안 만료 시간 (TTL)
                </label>
                <span className="font-mono font-bold text-blue-600 text-xs">
                  {presignedTtl}분
                </span>
              </div>
              <input
                type="range"
                min={15}
                max={240}
                step={15}
                value={presignedTtl}
                onChange={e => setPresignedTtl(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-500">
                검수자가 영상을 열었을 때 S3로부터 직접 서명된 토큰 스트리밍 URL의 유효 시간을 제어합니다. (권장: 60분)
              </p>
            </div>

            {/* 2. S3 Lifecycle Glacier Archive */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  S3 수명주기 규칙 (자동 Glacier 아카이브)
                </label>
                <span className="font-mono font-bold text-indigo-600 text-xs">
                  {glacierDays}일 후 이동
                </span>
              </div>
              <input
                type="range"
                min={14}
                max={180}
                step={7}
                value={glacierDays}
                onChange={e => setGlacierDays(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[11px] text-slate-500">
                검수 승인 완료 후 지정된 기간 동안 재생 이력이 없는 영상 원본을 비용이 80% 저렴한 S3 Glacier Instant Retrieval로 자동 이전합니다.
              </p>
            </div>

            {/* 3. ABR Transcoding Profiles */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                AWS MediaConvert HLS 트랜스코딩 프로파일
              </label>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hlsProfiles.p1080}
                    onChange={e => setHlsProfiles({ ...hlsProfiles, p1080: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>1080p Full HD (6,000 kbps, 60fps) - 마스터 검수용</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hlsProfiles.p720}
                    onChange={e => setHlsProfiles({ ...hlsProfiles, p720: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>720p HD (2,500 kbps, 30fps) - 모바일 및 빠른 탐색용</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hlsProfiles.p480}
                    onChange={e => setHlsProfiles({ ...hlsProfiles, p480: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>480p SD (1,000 kbps, 24fps) - 저대역폭 백업 스트림</span>
                </label>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                설정 저장 및 S3 버킷 정책 반영
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
