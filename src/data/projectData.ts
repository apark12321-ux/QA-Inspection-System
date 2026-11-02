import { ProjectItem } from '../types';

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-khcu',
    name: '경희사이버대학교 2026학년도 원격 정규 교육과정 콘텐츠 개발 사업',
    alias: 'khcu',
    weekCount: 1,
    sessionCount: 2,
    videoCount: 0,
    sessions: [
      {
        id: 'sess-khcu-01',
        title: '시니어재무컨설팅 (1인강의형)',
        videoCount: 0,
        videos: []
      },
      {
        id: 'sess-khcu-02',
        title: '세무실무적용사례 (1인강의형)',
        videoCount: 0,
        videos: []
      }
    ]
  }
];
