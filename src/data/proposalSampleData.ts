import { ProposalSampleItem } from '../types';

export const INITIAL_PROPOSAL_SAMPLES: ProposalSampleItem[] = [
  {
    id: 'sample-khcu-01',
    title: '시니어재무컨설팅',
    institution: '경희사이버대학교',
    lectureType: '1인강의형',
    instructor: '성진호 교수',
    thumbnailUrl: '/assets/aistudio/image_f623d953.png',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
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
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    descriptionBullets: [
      '사진, 영상 등의 다양한 시각적 자료를 활용한 직관적 설명',
      '현업 세무 신고 서식 및 판례 기반 실무 적용 가이드',
      '원거리 및 모바일 환경에서도 가독성이 뛰어난 전면 강의 연출'
    ],
    duration: 1650,
    createdAt: '2026.10.28'
  },
  {
    id: 'sample-inha-03',
    title: 'Bio Health 시대의 ESG와 지속 가능한 성장',
    institution: '인하대학교',
    lectureType: '스튜디오형',
    instructor: '한광식 교수',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    descriptionBullets: [
      'GRI Standards 및 글로벌 공급망 K-ESG 실사 프레임워크 해설',
      '바이오 헬스케어 산업 특화 환경경영(E) 및 윤리 거버넌스(G) 사례',
      '전문 스튜디오 고화질 1080p 촬영 및 AI 영한 자막 완비'
    ],
    duration: 3015,
    createdAt: '2026.10.27'
  },
  {
    id: 'sample-police-04',
    title: '가상자산 추적과 분석 심화: 포렌식 및 수사',
    institution: '경찰수사연수원',
    lectureType: '모션그래픽형',
    instructor: '디지털포렌식 수사관',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    descriptionBullets: [
      '온체인 블록체인 트랜잭션 흐름 및 자금세탁(CMLN) 추적 기법',
      '주소 클러스터링 및 휴리스틱 수사 실전 시뮬레이션',
      '2D/3D 인포그래픽을 활용한 복합 금융 범죄 다이어그램 시각화'
    ],
    duration: 2100,
    createdAt: '2026.10.26'
  },
  {
    id: 'sample-syu-05',
    title: '스마트미래교육 SU-MOOC 디지털 리터러시',
    institution: '삼육대학교',
    lectureType: '크로마키형',
    instructor: '교육공학 교수진',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    descriptionBullets: [
      '생성형 AI를 활용한 학습자 맞춤형 상호작용 설계',
      '크로마키 배경 그래픽 합성을 통한 입체적 강의 연출',
      'LMS 및 모바일 e-러닝 표준 SCORM 패키징 호환'
    ],
    duration: 1950,
    createdAt: '2026.10.25'
  }
];

export const INITIAL_PROPOSAL_CLIENTS: import('../types').ProposalClientPackage[] = [
  {
    id: 'client-khcu',
    name: '경희사이버대학교',
    slug: 'khcu',
    proposalTitle: '2026학년도 원격 정규 교육과정 온라인 콘텐츠 개발 사업 제안',
    assignedSampleIds: ['sample-khcu-01', 'sample-khcu-02'],
    customNotice: '경희사이버대학교 제안서 서류평가 심사용 1인강의형 대표 샘플입니다. 타 사 정보는 노출되지 않습니다.',
    contactPerson: '후미디어 제작총괄팀',
    createdAt: '2026.10.28'
  },
  {
    id: 'client-inha',
    name: '인하대학교',
    slug: 'inha',
    proposalTitle: 'Bio Health ESG 실감형 온라인 강좌 개발 제안',
    assignedSampleIds: ['sample-inha-03'],
    customNotice: '인하대학교 제안서 심사용 스튜디오 고화질 제작 샘플입니다.',
    contactPerson: '후미디어 제작총괄팀',
    createdAt: '2026.10.27'
  },
  {
    id: 'client-police',
    name: '경찰수사연수원',
    slug: 'police',
    proposalTitle: '디지털포렌식 및 가상자산 수사 심화 교육과정 제작 제안',
    assignedSampleIds: ['sample-police-04'],
    customNotice: '경찰수사연수원 전문 직무 교육 모션그래픽형 제작 샘플입니다.',
    contactPerson: '후미디어 제작총괄팀',
    createdAt: '2026.10.26'
  },
  {
    id: 'client-syu',
    name: '삼육대학교',
    slug: 'syu',
    proposalTitle: 'SU-MOOC 스마트미래교육 크로마키 강좌 개발 제안',
    assignedSampleIds: ['sample-syu-05'],
    customNotice: '삼육대학교 SU-MOOC 크로마키 합성 교육과정 샘플입니다.',
    contactPerson: '후미디어 제작총괄팀',
    createdAt: '2026.10.25'
  }
];

