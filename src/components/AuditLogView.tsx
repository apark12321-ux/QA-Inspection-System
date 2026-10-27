import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { downloadFile } from '../utils/formatters';
import {
  FileText,
  Search,
  Download,
  Filter,
  ShieldAlert,
  User,
  Clock
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchSearch =
        searchQuery === '' ||
        log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase());

      const matchAction =
        actionFilter === 'ALL' || log.action.startsWith(actionFilter);

      return matchSearch && matchAction;
    });
  }, [auditLogs, searchQuery, actionFilter]);

  const handleExportCsv = () => {
    const headers = ['Log ID', 'Timestamp', 'Actor', 'Role', 'Action', 'Target', 'Details', 'IP Address'];
    const rows = auditLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.actor}"`,
      l.role,
      l.action,
      `"${l.target}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ipAddress || '127.0.0.1'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, `Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>시스템 및 사용자 활동 감사 로그 (Audit Trail)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            검수 승인/반려, 의견 작성, 파일 업로드, 권한 변경 등 모든 작업 이력을 불변 감사 로그로 보관합니다.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>감사 로그 CSV 다운로드</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="담당자, 대상 파일, 작업 유형 검색..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:w-52 shrink-0">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
          >
            <option value="ALL">전체 작업 유형</option>
            <option value="VERDICT">검수 결과 (승인/반려)</option>
            <option value="COMMENT">검수 의견 추가</option>
            <option value="VIDEO">동영상 업로드/삭제</option>
            <option value="ROLE">권한 및 역할 변경</option>
            <option value="AI">AI 자막 생성</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                <th className="py-3.5 px-5">일시</th>
                <th className="py-3.5 px-5">작업자</th>
                <th className="py-3.5 px-5">작업 유형</th>
                <th className="py-3.5 px-5">대상 (Target)</th>
                <th className="py-3.5 px-5">상세 내용</th>
                <th className="py-3.5 px-5 text-right font-mono">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    조건에 해당하는 활동 감사 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-500 whitespace-nowrap tabular-nums text-xs">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.actor}</div>
                      <span className="text-[10px] font-mono text-slate-400">[{log.role}]</span>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded font-mono ${
                          log.action.includes('APPROVED')
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action.includes('REJECTED')
                            ? 'bg-red-100 text-red-800'
                            : log.action.includes('UPLOAD')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-800 font-semibold max-w-[180px] truncate">
                      {log.target}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 text-xs max-w-md">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-[11px] text-slate-400 tabular-nums">
                      {log.ipAddress || '192.168.1.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-mono flex items-center justify-between">
          <span>총 {filteredLogs.length}건 표시됨</span>
          <span>Security Audit Trail Ver. 2026.10</span>
        </div>
      </div>

    </div>
  );
};
