import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  Shield,
  UserCheck,
  Film,
  Eye,
  Check,
  X,
  Users
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { users, currentUser, updateUserRole, switchRole } = useApp();

  const permissionsMatrix = [
    { feature: '영상 시청 및 타임라인 탐색', admin: true, reviewer: true, creator: true, viewer: true },
    { feature: '검수 의견 등록 (타임스탬프 기록)', admin: true, reviewer: true, creator: false, viewer: false },
    { feature: '검수 결과 판정 (승인/반려/대기)', admin: true, reviewer: true, creator: false, viewer: false },
    { feature: 'AI 자동 자막 생성 및 번역 도구 사용', admin: true, reviewer: true, creator: true, viewer: false },
    { feature: '신규 영상 업로드 (드래그 앤 드롭)', admin: true, reviewer: false, creator: true, viewer: false },
    { feature: '파이프라인 재실행 및 관리', admin: true, reviewer: false, creator: false, viewer: false },
    { feature: '사용자 역할 및 권한 변경', admin: true, reviewer: false, creator: false, viewer: false },
    { feature: '활동 감사 로그 열람 및 CSV 내보내기', admin: true, reviewer: false, creator: false, viewer: false }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span>역할 기반 권한 관리 (Role-Based Access Control)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            사내 구성원별 역할(관리자, 검수자, 제작자, 뷰어)에 따른 세부 기능 접근 제어 매트릭스를 관리합니다.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
          현재 로그인 역할: <strong className="text-blue-700">{currentUser.role}</strong>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>역할별 기능 접근 권한 매트릭스</span>
          </h3>
          <span className="text-xs text-slate-500">RBAC Policy v2.4</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                <th className="py-3 px-6">기능 및 작업 권한</th>
                <th className="py-3 px-4 text-center text-indigo-700">관리자 (Admin)</th>
                <th className="py-3 px-4 text-center text-emerald-700">검수자 (Reviewer)</th>
                <th className="py-3 px-4 text-center text-amber-700">제작자 (Creator)</th>
                <th className="py-3 px-4 text-center text-slate-700">뷰어 (Viewer)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="py-3 px-6 font-medium text-slate-900">{item.feature}</td>
                  
                  <td className="py-3 px-4 text-center">
                    {item.admin ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {item.reviewer ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {item.creator ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {item.viewer ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Accounts List & Role Assignment */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>사내 사용자 계정 및 권한 설정</span>
          </h3>
          <span className="text-xs text-slate-500">총 {users.length}명 등록</span>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map(u => (
            <div
              key={u.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                  {u.name.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{u.name}</span>
                    <span className="text-xs text-slate-400 font-mono">({u.email})</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    소속: {u.department} · 마지막 접속: {u.lastActive}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <select
                  value={u.role}
                  onChange={e => updateUserRole(u.id, e.target.value as UserRole)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="ADMIN">관리자 (ADMIN)</option>
                  <option value="REVIEWER">검수자 (REVIEWER)</option>
                  <option value="CREATOR">제작자 (CREATOR)</option>
                  <option value="VIEWER">뷰어 (VIEWER)</option>
                </select>

                <button
                  onClick={() => switchRole(u.role)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  title="이 사용자의 권한으로 즉시 전환"
                >
                  권한 테스트
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
