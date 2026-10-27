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
  {
    id: 'vid-01',
    weekId: 1,
    weekTitle: 'AI 시대, 새로운 스토리텔링의 문법',
    sessionTitle: '이야기의 뼈대와 모티프(Motif)',
    fileName: '26story01_01_01.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 749, // 12:29
    fileSize: '245 MB',
    status: 'APPROVED',
    uploadedAt: '2026.10.26 10:15',
    updatedAt: '2026.10.26 14:20',
    reviewerName: '이영희',
    reviews: [
      {
        id: 'rev-101',
        author: '이영희',
        role: 'REVIEWER',
        timestampSeconds: 45,
        timestampFormatted: '00:45',
        verdict: 'APPROVED',
        content: '도입부 인트로 타이틀 모션 및 오디오 싱크 정확함. 전체 강의 흐름 우수하여 최종 승인합니다.',
        createdAt: '2026.10.26 14:20'
      }
    ],
    subtitles: [
      {
        id: 1,
        startTime: '00:00',
        endTime: '00:06',
        startSeconds: 0,
        endSeconds: 6,
        textKo: '안녕하세요. AI와 함께 쓰는 스토리텔링 워크숍 첫 번째 차시입니다.',
        textEn: 'Hello. Welcome to the first session of the Storytelling with AI workshop.'
      },
      {
        id: 2,
        startTime: '00:07',
        endTime: '00:15',
        startSeconds: 7,
        endSeconds: 15,
        textKo: '오늘은 모든 서사의 출발점이 되는 이야기의 뼈대와 모티프(Motif)를 살펴보겠습니다.',
        textEn: 'Today, we will examine the backbone of narrative and motifs that serve as the foundation.'
      },
      {
        id: 3,
        startTime: '00:16',
        endTime: '00:25',
        startSeconds: 16,
        endSeconds: 25,
        textKo: '좋은 스토리는 강력한 내적 동기와 이를 상징하는 오브젝트의 반복을 통해 탄생합니다.',
        textEn: 'A compelling story is born through strong inner motivation and recurring symbolic objects.'
      }
    ],
    pipeline: {
      jobId: 'job-aws-101',
      overallProgress: 100,
      currentStage: '완료 (S3 배포됨)',
      stages: [
        { name: 'S3 Multipart Upload', description: '원본 영상 업로드 완료', status: 'done', progress: 100, timestamp: '10:15' },
        { name: 'AWS MediaConvert', description: '1080p/720p H.264 트랜스코딩', status: 'done', progress: 100, timestamp: '10:18' },
        { name: 'Gemini AI Subtitles', description: '음성 추출 및 자막/번역 생성', status: 'done', progress: 100, timestamp: '10:20' },
        { name: 'DynamoDB Indexing', description: '메타데이터 인덱싱 및 배포', status: 'done', progress: 100, timestamp: '10:21' }
      ]
    }
  },
  {
    id: 'vid-02',
    weekId: 1,
    weekTitle: 'AI 시대, 새로운 스토리텔링의 문법',
    sessionTitle: '단편 <수학여행>의 서사 전략과 Motif',
    fileName: '26story01_02_04.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 749, // 12:29 matching the screenshot
    fileSize: '260 MB',
    status: 'REJECTED',
    uploadedAt: '2026.10.26 13:28',
    updatedAt: '2026.10.26 15:42',
    reviewerName: '이영희',
    reviews: [
      {
        id: 'rev-201',
        author: '이영희',
        role: 'REVIEWER',
        timestampSeconds: 192,
        timestampFormatted: '03:12',
        verdict: 'REJECTED',
        content: "03:12 하단 자막 오타 발견: '학습' -> '학습 전략'으로 수정 부탁드립니다. 강사님 발음과 싱크도 0.5초가량 밀립니다.",
        createdAt: '2026.10.26 15:35'
      },
      {
        id: 'rev-202',
        author: '이영희',
        role: 'REVIEWER',
        timestampSeconds: 525,
        timestampFormatted: '08:45',
        verdict: 'REJECTED',
        content: '08:45 배경음악(BGM) 게인이 너무 높아 강사 목소리가 묻힙니다. 볼륨 -4dB 조절 후 재인코딩 요망합니다.',
        createdAt: '2026.10.26 15:42'
      }
    ],
    subtitles: [
      {
        id: 1,
        startTime: '00:00',
        endTime: '00:05',
        startSeconds: 0,
        endSeconds: 5,
        textKo: '단편 영화 <수학여행>의 서사 전략 분석을 시작하겠습니다.',
        textEn: 'We will begin the narrative strategy analysis of the short film "School Trip".'
      },
      {
        id: 2,
        startTime: '00:06',
        endTime: '00:14',
        startSeconds: 6,
        endSeconds: 14,
        textKo: '본 작품에서 기차역과 낡은 카메라라는 모티프가 인물의 심리를 어떻게 대변하는지 주목해 보세요.',
        textEn: 'Notice how the motifs of the train station and the vintage camera represent the characters psyche.'
      },
      {
        id: 3,
        startTime: '03:10',
        endTime: '03:18',
        startSeconds: 190,
        endSeconds: 198,
        textKo: '이 장면에서의 학습 전략과 복선 회수는 서사의 클라이맥스를 준비하는 결정적 계기가 됩니다.',
        textEn: 'The strategic foreshadowing in this scene becomes the pivotal trigger preparing for the narrative climax.'
      }
    ],
    pipeline: {
      jobId: 'job-aws-102',
      overallProgress: 100,
      currentStage: '검수 완료 (반려됨)',
      stages: [
        { name: 'S3 Multipart Upload', description: '260MB 원본 저장', status: 'done', progress: 100, timestamp: '13:28' },
        { name: 'AWS MediaConvert', description: '트랜스코딩 및 썸네일 생성', status: 'done', progress: 100, timestamp: '13:31' },
        { name: 'Gemini AI Subtitles', description: 'AI 자막/번역 추출', status: 'done', progress: 100, timestamp: '13:33' },
        { name: 'DynamoDB Indexing', description: '검수 대기열 등록', status: 'done', progress: 100, timestamp: '13:34' }
      ]
    }
  },
  {
    id: 'vid-03',
    weekId: 1,
    weekTitle: 'AI 시대, 새로운 스토리텔링의 문법',
    sessionTitle: '캐릭터 내적 갈등과 플롯의 상관관계',
    fileName: '26story01_03_02.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 654,
    fileSize: '210 MB',
    status: 'APPROVED',
    uploadedAt: '2026.10.26 11:40',
    updatedAt: '2026.10.26 16:10',
    reviewerName: '이영희',
    reviews: [
      {
        id: 'rev-301',
        author: '이영희',
        role: 'REVIEWER',
        timestampSeconds: 80,
        timestampFormatted: '01:20',
        verdict: 'APPROVED',
        content: '인물 관계도 CG 그래픽 해상도 선명하고 내용 검수 이상 없습니다.',
        createdAt: '2026.10.26 16:10'
      }
    ],
    subtitles: [],
    pipeline: {
      jobId: 'job-aws-103',
      overallProgress: 100,
      currentStage: '완료',
      stages: [
        { name: 'S3 Multipart Upload', description: '업로드 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '인코딩 완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '자막 생성 완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '등록 완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: 'vid-04',
    weekId: 2,
    weekTitle: '생성형 AI를 활용한 시나리오 디벨롭',
    sessionTitle: '프롬프트로 구축하는 3막 구조와 반전',
    fileName: '26story02_01_03.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 820,
    fileSize: '310 MB',
    status: 'PENDING',
    uploadedAt: '2026.10.26 14:50',
    updatedAt: '2026.10.26 14:50',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-aws-104',
      overallProgress: 100,
      currentStage: '검수 대기 중',
      stages: [
        { name: 'S3 Multipart Upload', description: '업로드 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '트랜스코딩 완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: 'AI 자막 대기 중', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '검수 큐 인입', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: 'vid-05',
    weekId: 2,
    weekTitle: '생성형 AI를 활용한 시나리오 디벨롭',
    sessionTitle: 'AI 페르소나 대화 기법을 통한 대사 창작',
    fileName: '26story02_02_01.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    duration: 710,
    fileSize: '235 MB',
    status: 'APPROVED',
    uploadedAt: '2026.10.26 09:20',
    updatedAt: '2026.10.26 12:00',
    reviewerName: '김관리',
    reviews: [
      {
        id: 'rev-501',
        author: '김관리',
        role: 'ADMIN',
        timestampSeconds: 15,
        timestampFormatted: '00:15',
        verdict: 'APPROVED',
        content: '실습 프롬프트 텍스트 가독성 최적화 확인 완료. 승인 처리합니다.',
        createdAt: '2026.10.26 12:00'
      }
    ],
    subtitles: [],
    pipeline: {
      jobId: 'job-aws-105',
      overallProgress: 100,
      currentStage: '완료',
      stages: [
        { name: 'S3 Multipart Upload', description: '업로드 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '인코딩 완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '자막 완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '인덱스 완료', status: 'done', progress: 100 }
      ]
    }
  },
  {
    id: 'vid-06',
    weekId: 3,
    weekTitle: '멀티모달 비주얼 스토리보딩',
    sessionTitle: '스테이지 조명과 카메라 앵글 프롬프트',
    fileName: '26story03_01_02.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    duration: 590,
    fileSize: '190 MB',
    status: 'PROCESSING',
    uploadedAt: '2026.10.26 16:30',
    updatedAt: '2026.10.26 16:35',
    reviews: [],
    subtitles: [],
    pipeline: {
      jobId: 'job-aws-106',
      overallProgress: 68,
      currentStage: 'AWS MediaConvert 인코딩 중 (68%)',
      stages: [
        { name: 'S3 Multipart Upload', description: '190MB 업로드 성공', status: 'done', progress: 100, timestamp: '16:30' },
        { name: 'AWS MediaConvert', description: 'H.264 1080p ABR 프로파일 인코딩 중', status: 'active', progress: 68, timestamp: '16:32' },
        { name: 'Gemini AI Subtitles', description: '음성 추출 및 다국어 번역 대기', status: 'waiting', progress: 0 },
        { name: 'DynamoDB Indexing', description: '메타데이터 등록 대기', status: 'waiting', progress: 0 }
      ]
    }
  },
  {
    id: 'vid-07',
    weekId: 3,
    weekTitle: '멀티모달 비주얼 스토리보딩',
    sessionTitle: '음향 효과와 엠비언스 사운드 믹싱 검수',
    fileName: '26story03_02_04.mp4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    duration: 890,
    fileSize: '298 MB',
    status: 'APPROVED',
    uploadedAt: '2026.10.25 17:10',
    updatedAt: '2026.10.26 09:30',
    reviewerName: '이영희',
    reviews: [
      {
        id: 'rev-701',
        author: '이영희',
        role: 'REVIEWER',
        timestampSeconds: 120,
        timestampFormatted: '02:00',
        verdict: 'APPROVED',
        content: '마스터 음향 LUFS 규격(-14 LUFS) 기준 완벽 준수 확인. 검수 승인합니다.',
        createdAt: '2026.10.26 09:30'
      }
    ],
    subtitles: [],
    pipeline: {
      jobId: 'job-aws-107',
      overallProgress: 100,
      currentStage: '완료',
      stages: [
        { name: 'S3 Multipart Upload', description: '업로드 완료', status: 'done', progress: 100 },
        { name: 'AWS MediaConvert', description: '인코딩 완료', status: 'done', progress: 100 },
        { name: 'Gemini AI Subtitles', description: '자막 완료', status: 'done', progress: 100 },
        { name: 'DynamoDB Indexing', description: '인덱스 완료', status: 'done', progress: 100 }
      ]
    }
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    actor: '이영희',
    role: 'REVIEWER',
    action: 'VERDICT_REJECTED',
    target: '26story01_02_04.mp4',
    details: '03:12 자막 오타 및 08:45 음향 레벨 불량으로 검수 반려 등록',
    timestamp: '2026.10.26 15:42',
    ipAddress: '192.168.1.42'
  },
  {
    id: 'log-002',
    actor: '이영희',
    role: 'REVIEWER',
    action: 'COMMENT_ADDED',
    target: '26story01_02_04.mp4',
    details: '타임스탬프 03:12 의견 추가',
    timestamp: '2026.10.26 15:35',
    ipAddress: '192.168.1.42'
  },
  {
    id: 'log-003',
    actor: '김관리',
    role: 'ADMIN',
    action: 'VERDICT_APPROVED',
    target: '26story02_02_01.mp4',
    details: '실습 프롬프트 가독성 확인 후 승인 처리',
    timestamp: '2026.10.26 12:00',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'log-004',
    actor: '박제작',
    role: 'CREATOR',
    action: 'VIDEO_UPLOAD',
    target: '26story03_01_02.mp4',
    details: '3주차 1차시 영상 190MB S3 멀티파트 업로드 실행',
    timestamp: '2026.10.26 16:30',
    ipAddress: '10.0.4.15'
  },
  {
    id: 'log-005',
    actor: '김관리',
    role: 'ADMIN',
    action: 'AI_SUBTITLE_RUN',
    target: '26story01_01_01.mp4',
    details: 'Gemini 3.8 Flash 음성인식 및 영문 번역 자막 생성 완료',
    timestamp: '2026.10.26 10:20',
    ipAddress: '192.168.1.10'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'rejection',
    title: '동영상 검수 반려 알림',
    body: "이영희 검수자가 '26story01_02_04.mp4'에 2건의 수정 요청을 등록했습니다.",
    timestamp: '15:42',
    read: false,
    videoId: 'vid-02'
  },
  {
    id: 'notif-2',
    type: 'pipeline',
    title: '영상 트랜스코딩 완료',
    body: "'26story02_01_03.mp4' AWS MediaConvert 작업이 완료되었습니다.",
    timestamp: '14:52',
    read: false,
    videoId: 'vid-04'
  },
  {
    id: 'notif-3',
    type: 'approval',
    title: '검수 승인 완료',
    body: "'26story02_02_01.mp4' 강의가 최종 승인되었습니다.",
    timestamp: '12:01',
    read: true,
    videoId: 'vid-05'
  }
];
