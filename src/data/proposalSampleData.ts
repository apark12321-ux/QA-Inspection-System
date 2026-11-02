import { ProposalSampleItem, ProposalClientPackage } from '../types';

export const INITIAL_PROPOSAL_SAMPLES: ProposalSampleItem[] = [
  {
    id: 'sample-khcu-01',
    title: '시니어재무컨설팅',
    institution: '경희사이버대학교',
    lectureType: '1인강의형',
    instructor: '성진호 교수',
    thumbnailUrl: '/assets/aistudio/image_f623d953.png',
    videoUrl: '',
    descriptionBullets: [
      '사진, 영상 등의 다양한 시각적 자료를 효과적으로 활용',
      '시니어 은퇴 후 실물 자산 및 재무 리스크 진단 모델 제시',
      '학습자 몰입도를 높이는 전자칠판 판서 및 핵심 요약 구성'
    ],
    duration: 1820,
    createdAt: '2026.10.28'
  },
  {
    id: 'sample-khcu-02',
    title: '세무실무적용사례',
    institution: '경희사이버대학교',
    lectureType: '1인강의형',
    instructor: '세무 전문가',
    thumbnailUrl: '/assets/aistudio/image_3611f98b.png',
    videoUrl: '',
    descriptionBullets: [
      '사진, 영상 등의 다양한 시각적 자료를 활용한 직관적 설명',
      '현업 세무 신고 서식 및 판례 기반 실무 적용 가이드',
      '원거리 및 모바일 환경에서도 가독성이 뛰어난 전면 강의 연출'
    ],
    duration: 1650,
    createdAt: '2026.10.28'
  }
];

export const INITIAL_PROPOSAL_CLIENTS: ProposalClientPackage[] = [
  {
    id: 'client-khcu',
    name: '경희사이버대학교',
    slug: 'khcu',
    proposalTitle: '2026학년도 원격 정규 교육과정 온라인 콘텐츠 개발 사업 제안',
    assignedSampleIds: ['sample-khcu-01', 'sample-khcu-02'],
    customNotice: '경희사이버대학교 제안서 서류평가 심사용 1인강의형 대표 샘플입니다. 타 사 정보는 노출되지 않습니다.',
    contactPerson: '후미디어 제작총괄팀',
    createdAt: '2026.10.28'
  }
];
