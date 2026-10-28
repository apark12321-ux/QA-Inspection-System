import { VideoSession, UserAccount, AuditLog, NotificationItem } from '../types';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user_admin',
    name: '김관리 (Admin)',
    email: 'admin@corporate-edu.com',
    role: 'ADMIN',
    department: '교육콘텐츠운영본부',
    status: 'active',
    lastActive: '방금 전'
  },
  {
    id: 'user_rev1',
    name: '이영희 (Reviewer)',
    email: 'yh.lee@corporate-edu.com',
    role: 'REVIEWER',
    department: '영상품질검수팀',
    status: 'active',
    lastActive: '10분 전'
  },
  {
    id: 'user_creator1',
    name: '박제작 (Creator)',
    email: 'creator.park@studio-alpha.com',
    role: 'CREATOR',
    department: '디지털미디어제작실',
    status: 'active',
    lastActive: '1시간 전'
  },
  {
    id: 'user_viewer',
    name: '최참관 (Viewer)',
    email: 'viewer.choi@partner.com',
    role: 'VIEWER',
    department: '외부감리단',
    status: 'active',
    lastActive: '3일 전'
  }
];

export const INITIAL_VIDEOS: VideoSession[] = [
  // 1. Bio Health 시대의 ESG와 지속 가능한 성장 (Screenshot 1 Active Dataset)
  {
    id: 'dhc26_01',
    projectId: 'proj-bio-esg',
    weekId: 1,
    weekTitle: 'Bio Health 시대의 ESG와 지속 가능한 성장',
    sessionTitle: 'ESG 마인드 없이는 성장도 없다',
    fileName: 'dhc26_01.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 3015, // 50:15
    fileSize: '800 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 19:54',
    updatedAt: '2026.10.27 19:54',
    reviewerName: '',
    reviews: [],
    subtitles: [
      {
        id: 1,
        startTime: '00:00',
        endTime: '00:08',
        startSeconds: 0,
        endSeconds: 8,
        textKo: '안녕하십니까? 전문대학 평생직업교육 혁신과 ESG 생태계 조성입니다.',
        textEn: 'Hello. Welcome to Vocational Education Innovation and ESG Ecosystem Creation.'
      },
      {
        id: 2,
        startTime: '00:08',
        endTime: '00:22',
        startSeconds: 8,
        endSeconds: 22,
        textKo: '오늘은 ESG 마인드 없이는 기업의 지속 가능한 성장도 불가능하다는 핵심 주제를 다루겠습니다.',
        textEn: 'Today we discuss the core thesis: sustainable corporate growth is impossible without an ESG mindset.'
      },
      {
        id: 3,
        startTime: '00:22',
        endTime: '00:40',
        startSeconds: 22,
        endSeconds: 40,
        textKo: '한광식 교수와 함께 Bio Health 산업 현장의 실질적인 사례를 입체적으로 점검해 보겠습니다.',
        textEn: 'Together with Professor Kwang-Sik Han, we will examine practical cases across the Bio Health industry.'
      },
      {
        id: 4,
        startTime: '00:40',
        endTime: '01:02',
        startSeconds: 40,
        endSeconds: 62,
        textKo: '환경(E), 사회적 책임(S), 투명한 지배구조(G)는 이제 단순한 권고사항이 아닌 기업 생존의 필수 지표입니다.',
        textEn: 'Environment (E), Social Responsibility (S), and Transparent Governance (G) are now indispensable survival metrics.'
      },
      {
        id: 5,
        startTime: '01:02',
        endTime: '01:30',
        startSeconds: 62,
        endSeconds: 90,
        textKo: '특히 바이오 헬스케어 분야는 연구 윤리와 임상 데이터 신뢰성, 공급망 ESG 실사가 기업 가치를 직접 결정합니다.',
        textEn: 'Particularly in bio healthcare, research ethics, clinical data credibility, and supply chain ESG audits determine enterprise valuation.'
      },
      {
        id: 6,
        startTime: '01:30',
        endTime: '02:05',
        startSeconds: 90,
        endSeconds: 125,
        textKo: '글로벌 공시 기준인 GRI Standards와 K-ESG 가이드라인의 핵심 프레임워크를 슬라이드와 함께 확인해 보겠습니다.',
        textEn: 'Let us inspect the core frameworks of global disclosure standards including GRI Standards and K-ESG guidelines.'
      },
      {
        id: 7,
        startTime: '02:05',
        endTime: '02:45',
        startSeconds: 125,
        endSeconds: 165,
        textKo: 'Scope 1, 2, 3 온실가스 배출량 산정과 탄소중립 로드맵 수립에 관한 주요 대학-기업 연계 사례를 분석합니다.',
        textEn: 'We analyze Scope 1, 2, and 3 greenhouse gas inventories and carbon neutrality roadmaps from industry-academia partnerships.'
      },
      {
        id: 8,
        startTime: '02:45',
        endTime: '03:30',
        startSeconds: 165,
        endSeconds: 210,
        textKo: '지역사회 보건 향상 및 상생 협력 프로그램(S)을 통해 사회적 가치를 창출하는 모델을 고찰하겠습니다.',
        textEn: 'We review models generating social value through community healthcare enhancement and shared growth programs.'
      },
      {
        id: 9,
        startTime: '03:30',
        endTime: '04:20',
        startSeconds: 210,
        endSeconds: 260,
        textKo: '이사회 독립성과 감사 위원회의 전문성을 강화하는 윤리 거버넌스(G) 구축 방안을 다룹니다.',
        textEn: 'We discuss constructing ethical governance that reinforces board independence and audit committee expertise.'
      },
      {
        id: 10,
        startTime: '04:20',
        endTime: '05:15',
        startSeconds: 260,
        endSeconds: 315,
        textKo: '현장 실무자가 지속가능경영 보고서를 작성할 때 반드시 준수해야 할 정량적 KPI 설정 원칙입니다.',
        textEn: 'These are quantitative KPI principles practitioners must follow when preparing sustainability reports.'
      },
      {
        id: 11,
        startTime: '05:15',
        endTime: '06:10',
        startSeconds: 315,
        endSeconds: 370,
        textKo: '지금까지 살펴본 ESG 핵심 요소를 바탕으로 현업에서의 단계별 적용 전략을 점검해 보시기 바랍니다.',
        textEn: 'Based on the ESG principles covered today, please review your staged execution strategy in the workplace.'
      },
      {
        id: 12,
        startTime: '06:10',
        endTime: '07:00',
        startSeconds: 370,
        endSeconds: 420,
        textKo: '다음 차시에서는 Bio Health 기업의 실제 ESG 평가 대응 및 글로벌 인증 실무를 이어가겠습니다.',
        textEn: 'In the next session, we will continue with practical responses to ESG ratings and global certification audits.'
      }
    ],
    pipeline: {
      jobId: 'job-dhc-01',
      overallProgress: 100,
      currentStage: '검수 대기 중 (S3 원본 저장 완료)',
      stages: [
        { name: 'S3 Multipart Upload', description: 'edutem-video-review 저장 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '1080p 고화질 트랜스코딩 완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: 'AI 자막 및 번역 인덱싱 완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '검수 대기열 동기화 완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: 'dhc26_02',
    projectId: 'proj-bio-esg',
    weekId: 1,
    weekTitle: 'Bio Health 시대의 ESG와 지속 가능한 성장',
    sessionTitle: 'ESG와 기업의 사회적 책임',
    fileName: 'dhc26_02.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 2840, // 47:20
    fileSize: '780 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 19:55',
    updatedAt: '2026.10.27 19:55',
    reviews: [],
    subtitles: [
      {
        id: 1,
        startTime: '00:00',
        endTime: '00:10',
        startSeconds: 0,
        endSeconds: 10,
        textKo: 'Bio Health 산업에서 사회적 책임(S)과 공급망 상생의 가치입니다.',
        textEn: 'The value of social responsibility (S) and supply chain co-prosperity in Bio Health.'
      }
    ],
    pipeline: {
      jobId: 'job-dhc-02',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '저장 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: 'dhc26_03',
    projectId: 'proj-bio-esg',
    weekId: 1,
    weekTitle: 'Bio Health 시대의 ESG와 지속 가능한 성장',
    sessionTitle: '지속가능경영 보고서 프레임워크',
    fileName: 'dhc26_03.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 3100, // 51:40
    fileSize: '820 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 19:56',
    updatedAt: '2026.10.27 19:56',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-dhc-03',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '저장 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: 'dhc26_04',
    projectId: 'proj-bio-esg',
    weekId: 1,
    weekTitle: 'Bio Health 시대의 ESG와 지속 가능한 성장',
    sessionTitle: 'Bio Health 산업의 환경경영(E)',
    fileName: 'dhc26_04.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 2750,
    fileSize: '750 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 19:57',
    updatedAt: '2026.10.27 19:57',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-dhc-04',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '저장 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: 'dhc26_05',
    projectId: 'proj-bio-esg',
    weekId: 1,
    weekTitle: 'Bio Health 시대의 ESG와 지속 가능한 성장',
    sessionTitle: 'ESG 거버넌스와 윤리경영(G)',
    fileName: 'dhc26_05.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: 2980,
    fileSize: '790 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 19:58',
    updatedAt: '2026.10.27 19:58',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-dhc-05',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '저장 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: 'dhc26_06',
    projectId: 'proj-bio-esg',
    weekId: 1,
    weekTitle: 'Bio Health 시대의 ESG와 지속 가능한 성장',
    sessionTitle: 'Bio Health 기업의 ESG 평가 대응',
    fileName: 'dhc26_06.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    duration: 3050,
    fileSize: '810 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 19:59',
    updatedAt: '2026.10.27 19:59',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-dhc-06',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '저장 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },

  // 2. 인하대학교 [대학혁신지원사업] 오픈런 (Screenshot 2)
  {
    id: 'inha26_pro_01',
    projectId: 'proj-inha',
    weekId: 1,
    weekTitle: '디지털 전환(DX)과 일자리 환경 변화',
    sessionTitle: '디지털 전환(DX)과 일자리 환경 변화',
    fileName: 'inha26_pro_01.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 749,
    fileSize: '1.6 GB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 09:48',
    updatedAt: '2026.10.27 09:48',
    reviewerName: '',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-inha-01',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '저장 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: 'inha26_pro_02',
    projectId: 'proj-inha',
    weekId: 1,
    weekTitle: 'Bio Health 산업의 ESG 실행과 사회공헌',
    sessionTitle: 'Bio Health 산업의 ESG 실행과 사회공헌',
    fileName: 'inha26_pro_02.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 620,
    fileSize: '96.9 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 09:49',
    updatedAt: '2026.10.27 09:49',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-inha-02',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '저장 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },

  // 3. 삼육대학교 SU-MOOC 강의콘텐츠 개발 (Screenshot 2)
  {
    id: 'syu26_pro_01',
    projectId: 'syu26',
    weekId: 1,
    weekTitle: '디지털 전환(DX)과 일자리 환경 변화',
    sessionTitle: '디지털 전환(DX)과 일자리 환경 변화',
    fileName: 'syu26_pro_01.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 749,
    fileSize: '1.6 GB',
    status: 'PENDING',
    uploadedAt: '2026.10.21 12:06',
    updatedAt: '2026.10.21 12:06',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-syu-01',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '저장 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: 'syu26_pro_02',
    projectId: 'syu26',
    weekId: 1,
    weekTitle: 'Bio Health 산업의 ESG 실행과 사회공헌',
    sessionTitle: 'Bio Health 산업의 ESG 실행과 사회공헌',
    fileName: 'syu26_pro_02.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 620,
    fileSize: '96.9 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.21 15:13',
    updatedAt: '2026.10.21 15:13',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-syu-02',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '저장 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },

  // 4. 가상자산 추적과 분석 심화 (Screenshot 2)
  {
    id: '26foren04_02_01',
    projectId: 'proj-forensic',
    weekId: 2,
    weekTitle: '온체인 자금세탁의 산업화',
    sessionTitle: '2025년 불법 자금 규모',
    fileName: '26foren04_02_01.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 812,
    fileSize: '166 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 18:40',
    updatedAt: '2026.10.27 18:40',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-foren01',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: '26foren04_02_02',
    projectId: 'proj-forensic',
    weekId: 2,
    weekTitle: '온체인 자금세탁의 산업화',
    sessionTitle: '중국어 기반 자금세탁 네트워크의 부상',
    fileName: '26foren04_02_02.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 734,
    fileSize: '129 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 18:40',
    updatedAt: '2026.10.27 18:40',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-foren02',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },

  // 5. AI와 함께 쓰는 스토리텔링 워크숍 (Screenshot 2)
  {
    id: '26story01_01_01',
    projectId: 'proj-storytelling',
    weekId: 1,
    weekTitle: 'AI 시대, 새로운 스토리텔링의 문법',
    sessionTitle: 'Opening',
    fileName: '26story01_01_01.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 749,
    fileSize: '60.5 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.27 15:00',
    updatedAt: '2026.10.27 15:00',
    reviewerName: '',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-story-01',
      overallProgress: 100,
      currentStage: '검수 대기',
      stages: [
        { name: 'S3 Multipart Upload', description: '완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: '26story01_02_02',
    projectId: 'proj-storytelling',
    weekId: 2,
    weekTitle: '이야기의 뼈대와 모티프(Motif)',
    sessionTitle: '영화 <수학여행> 감상',
    fileName: '26story01_02_02.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 840,
    fileSize: '646 MB',
    status: 'APPROVED',
    uploadedAt: '2026.10.26 13:27',
    updatedAt: '2026.10.26 14:10',
    reviewerName: '이영희',
    reviews: [
      {
        id: 'rev-st-01',
        author: '이영희',
        role: 'REVIEWER',
        timestampSeconds: 45,
        timestampFormatted: '00:45',
        verdict: 'APPROVED',
        content: '도입부 모션 및 오디오 싱크 확인 완료. 최종 승인합니다.',
        createdAt: '2026.10.26 14:10'
      }
    ],
    subtitles: [],
    pipeline: {
      jobId: 'job-story-02',
      overallProgress: 100,
      currentStage: '승인 완료',
      stages: [
        { name: 'S3 Multipart Upload', description: '완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
      ]
    }
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    actor: '이영희',
    role: 'REVIEWER',
    action: 'STATUS_PENDING',
    target: 'dhc26_01.mp4',
    details: 'Bio Health 시대의 ESG와 지속 가능한 성장 검수 대기열 진입',
    timestamp: '2026.10.27 19:54',
    ipAddress: '192.168.1.42'
  },
  {
    id: 'log-02',
    actor: '김관리',
    role: 'ADMIN',
    action: 'PROJECT_SETUP',
    target: 'Bio Health 시대의 ESG와 지속 가능한 성장',
    details: '17개 프로젝트 및 83개 동영상 메타데이터 연동 완료',
    timestamp: '2026.10.27 18:30',
    ipAddress: '192.168.1.10'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    type: 'upload',
    title: '새 영상 등록',
    body: 'Bio Health 시대의 ESG와 지속 가능한 성장 (dhc26_01.mp4) 등록 완료',
    timestamp: '19:54',
    read: false,
    videoId: 'dhc26_01'
  }
];
