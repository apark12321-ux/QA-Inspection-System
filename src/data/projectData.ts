import { ProjectItem, VideoSession } from '../types';

export const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-inha',
    name: '인하대학교 [대학혁신지원사업] 2026학년도 오픈런 공개용 온라인 콘텐츠 교과목 개발',
    alias: 'inha26',
    weekCount: 1,
    sessionCount: 3,
    videoCount: 2,
    sessions: [
      {
        id: 'sess-inha-01',
        title: '디지털 전환(DX)과 일자리 환경 변화',
        videoCount: 1,
        videos: [
          {
            id: 'inha26_pro_01',
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
            subtitles: [
              {
                id: 1,
                startTime: '00:00',
                endTime: '00:06',
                startSeconds: 0,
                endSeconds: 6,
                textKo: '인하대학교 오픈런 온라인 공개강좌 1차시 디지털 전환과 일자리 환경 변화입니다.',
                textEn: 'Inha University OpenLearn Online Lecture Session 1: Digital Transformation and Changing Job Environments.'
              },
              {
                id: 2,
                startTime: '00:07',
                endTime: '00:15',
                startSeconds: 7,
                endSeconds: 15,
                textKo: '산업 전반의 지능화와 자동화가 고용 생태계에 미치는 실질적 영향을 고찰합니다.',
                textEn: 'We examine the practical impact of industry-wide intelligence and automation on the employment ecosystem.'
              }
            ],
            pipeline: {
              jobId: 'job-s3-inha01',
              overallProgress: 100,
              currentStage: '검수 대기 중 (S3 원본 저장 완료)',
              stages: [
                { name: 'S3 Multipart Upload', description: 'edutem-video-review 저장 완료', status: 'done', progress: 100 },
                { name: 'AWS MediaConvert', description: '1080p 고화질 트랜스코딩 완료', status: 'done', progress: 100 },
                { name: 'Gemini AI Subtitles', description: 'AI 자막 및 번역 인덱싱 완료', status: 'done', progress: 100 },
                { name: 'DynamoDB Indexing', description: '검수 대기열 동기화 완료', status: 'done', progress: 100 }
              ]
            }
          }
        ]
      },
      {
        id: 'sess-inha-02',
        title: 'Bio Health 산업의 ESG 실행과 사회공헌',
        videoCount: 1,
        videos: [
          {
            id: 'inha26_pro_02',
            weekId: 1,
            weekTitle: 'Bio Health 산업의 ESG 실행과 사회공헌',
            sessionTitle: 'Bio Health 산업의 ESG 실행과 사회공헌',
            fileName: 'inha26_pro_02.mp4',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            duration: 620,
            fileSize: '96.9 MB',
            status: 'PENDING',
            uploadedAt: '2026.10.27 09:49',
            updatedAt: '2026.10.27 09:49',
            reviewerName: '',
            reviews: [],
            subtitles: [],
            pipeline: {
              jobId: 'job-s3-inha02',
              overallProgress: 100,
              currentStage: '검수 대기 중',
              stages: [
                { name: 'S3 Multipart Upload', description: 'edutem-video-review 저장 완료', status: 'done', progress: 100 },
                { name: 'AWS MediaConvert', description: 'H.264 인코딩 완료', status: 'done', progress: 100 },
                { name: 'Gemini AI Subtitles', description: '준비 완료', status: 'done', progress: 100 },
                { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
              ]
            }
          }
        ]
      },
      {
        id: 'sess-inha-03',
        title: 'Bio Health 시대의 ESG와 지속 가능한 성장 콘텐츠 개발',
        videoCount: 0,
        videos: []
      }
    ]
  },
  {
    id: 'proj-foren',
    name: '가상자산 추적과 분석 심화: 포렌식 및 수사',
    alias: '26foren04',
    weekCount: 3,
    sessionCount: 7,
    videoCount: 4,
    weeks: [
      {
        id: 'week-foren-01',
        title: '가상자산 추적의 기본 원리와 기법',
        sessions: [
          {
            id: 'sess-foren-01',
            title: '온체인 데이터와 자금 흐름 추적의 기초',
            weekTitle: '가상자산 추적의 기본 원리와 기법',
            videoCount: 0,
            videos: []
          },
          {
            id: 'sess-foren-02',
            title: '주소 클러스터링과 휴리스틱 분석 기법',
            weekTitle: '가상자산 추적의 기본 원리와 기법',
            videoCount: 0,
            videos: []
          },
          {
            id: 'sess-foren-03',
            title: 'UTXO 모델과 어카운트 모델의 추적 방식 비교',
            weekTitle: '가상자산 추적의 기본 원리와 기법',
            videoCount: 0,
            videos: []
          }
        ]
      },
      {
        id: 'week-foren-02',
        title: '온체인 자금세탁의 산업화 - CMLN·보증 플랫폼·스머핑',
        sessions: [
          {
            id: 'sess-foren-04',
            title: '2025년 불법 자금 규모',
            weekTitle: '온체인 자금세탁의 산업화',
            videoCount: 1,
            videos: [
              {
                id: '26foren04_02_01',
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
                    { name: 'S3 Multipart Upload', description: '업로드 완료', status: 'done', progress: 100 },
                    { name: 'AWS MediaConvert', description: '인코딩 완료', status: 'done', progress: 100 },
                    { name: 'Gemini AI Subtitles', description: '대기 중', status: 'done', progress: 100 },
                    { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
                  ]
                }
              }
            ]
          },
          {
            id: 'sess-foren-05',
            title: '중국어 기반 자금세탁 네트워크의 부상',
            weekTitle: '온체인 자금세탁의 산업화',
            videoCount: 1,
            videos: [
              {
                id: '26foren04_02_02',
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
              }
            ]
          },
          {
            id: 'sess-foren-06',
            title: 'CMLN이 파는 여섯 가지 상품',
            weekTitle: '온체인 자금세탁의 산업화',
            videoCount: 1,
            videos: [
              {
                id: '26foren04_02_03',
                weekId: 2,
                weekTitle: '온체인 자금세탁의 산업화',
                sessionTitle: 'CMLN이 파는 여섯 가지 상품',
                fileName: '26foren04_02_03.mp4',
                videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                duration: 890,
                fileSize: '168 MB',
                status: 'PENDING',
                uploadedAt: '2026.10.28 09:00',
                updatedAt: '2026.10.28 09:00',
                reviews: [],
                subtitles: [],
                pipeline: {
                  jobId: 'job-foren03',
                  overallProgress: 100,
                  currentStage: '검수 대기',
                  stages: [
                    { name: 'S3 Multipart Upload', description: '완료', status: 'done', progress: 100 },
                    { name: 'AWS MediaConvert', description: '완료', status: 'done', progress: 100 },
                    { name: 'Gemini AI Subtitles', description: '완료', status: 'done', progress: 100 },
                    { name: 'DynamoDB Indexing', description: '완료', status: 'done', progress: 100 }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'proj-story',
    name: 'AI와 함께 쓰는 스토리텔링 워크숍',
    alias: '26story01',
    weekCount: 1,
    sessionCount: 3,
    videoCount: 3,
    sessions: [
      {
        id: 'sess-story-01',
        title: '이야기의 뼈대와 모티프(Motif)',
        videoCount: 1,
        videos: []
      },
      {
        id: 'sess-story-02',
        title: '단편 <수학여행>의 서사 전략과 Motif',
        videoCount: 1,
        videos: []
      },
      {
        id: 'sess-story-03',
        title: '인물 간 갈등 증폭과 클라이맥스 조율',
        videoCount: 1,
        videos: []
      }
    ]
  },
  {
    id: 'proj-syu',
    name: '(혁신) 2026 삼육대학교 스마트미래교육 SU-MOOC 강의콘텐츠 개발 - 제안샘플 (주)후미디어',
    alias: 'syu26',
    weekCount: 2,
    sessionCount: 6,
    videoCount: 6
  },
  {
    id: 'proj-nurse-assoc',
    name: '[대한간호조무사협회] 간호조무사 온라인 보수교육(임상실무) 콘텐츠 샘플 시연',
    alias: 'n002',
    weekCount: 1,
    sessionCount: 4,
    videoCount: 4
  },
  {
    id: 'proj-inu-kmooc',
    name: '2026년 인천대학교 K-MOOC 신규 강좌 콘텐츠 개발 용역 콘텐츠 샘플시연',
    alias: 'k-mooc',
    weekCount: 1,
    sessionCount: 5,
    videoCount: 5
  },
  {
    id: 'proj-mohw-nurse',
    name: '2026년도 보건복지부 위탁 진료지원간호사 교육 지원사업 온라인 교육 콘텐츠 샘플시연',
    alias: 'nurse',
    weekCount: 1,
    sessionCount: 5,
    videoCount: 5
  },
  {
    id: 'proj-senior-rights',
    name: '노인인권보호 및 학대 예방교육',
    alias: 'dh2604',
    weekCount: 1,
    sessionCount: 4,
    videoCount: 4
  },
  {
    id: 'proj-robotics-ai',
    name: '로보틱스와 Physical AI 입문',
    alias: 'dong1',
    weekCount: 1,
    sessionCount: 4,
    videoCount: 4
  },
  {
    id: 'proj-gender-equality',
    name: '성폭력·직장내 성희롱 예방교육 : 관점 변화의 시작, 성인지감수성',
    alias: 'dh2603',
    weekCount: 1,
    sessionCount: 3,
    videoCount: 3
  },
  {
    id: 'proj-oral-infection',
    name: '안전한 방문구강관리를 위한 감염관리',
    alias: 'dh2606',
    weekCount: 1,
    sessionCount: 3,
    videoCount: 3
  },
  {
    id: 'proj-ai-philosophy',
    name: '인공지능과 철학',
    alias: '26philo03',
    weekCount: 1,
    sessionCount: 4,
    videoCount: 4
  },
  {
    id: 'proj-dental-assist',
    name: '초보 어시스트에서 수술 파트너로: 임플란트 수술 실전 가이드',
    alias: 'dh2605',
    weekCount: 1,
    sessionCount: 5,
    videoCount: 5
  },
  {
    id: 'proj-dental-ins-basic',
    name: '치과건강보험(기본·실무편)',
    alias: '1',
    weekCount: 1,
    sessionCount: 4,
    videoCount: 4
  },
  {
    id: 'proj-dental-ins-adv',
    name: '치과건강보험(심화·실전편)',
    alias: 'dh2602',
    weekCount: 1,
    sessionCount: 4,
    videoCount: 4
  },
  {
    id: 'proj-hrd-ai',
    name: 'AI·데이터기반 인재개발론',
    alias: '26data02',
    weekCount: 1,
    sessionCount: 5,
    videoCount: 5
  },
  {
    id: 'proj-bio-esg',
    name: 'Bio Health 시대의 ESG와 지속 가능한 성장',
    alias: 'dhc26',
    weekCount: 1,
    sessionCount: 6,
    videoCount: 6,
    sessions: [
      {
        id: 'sess-dhc-01',
        title: 'ESG 마인드 없이는 성장도 없다',
        videoCount: 1,
        videos: [
          {
            id: 'dhc26_01',
            weekId: 1,
            weekTitle: 'Bio Health 시대의 ESG와 지속 가능한 성장',
            sessionTitle: 'ESG 마인드 없이는 성장도 없다',
            fileName: 'dhc26_01.mp4',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            duration: 3015,
            fileSize: '800 MB',
            status: 'PENDING',
            uploadedAt: '2026.10.27 19:54',
            updatedAt: '2026.10.27 19:54',
            reviews: [],
            subtitles: [],
            pipeline: {
              jobId: 'job-dhc-01',
              overallProgress: 100,
              currentStage: '검수 대기',
              stages: []
            }
          }
        ]
      },
      {
        id: 'sess-dhc-02',
        title: 'ESG와 기업의 사회적 책임',
        videoCount: 1,
        videos: [
          {
            id: 'dhc26_02',
            weekId: 1,
            weekTitle: 'Bio Health 시대의 ESG와 지속 가능한 성장',
            sessionTitle: 'ESG와 기업의 사회적 책임',
            fileName: 'dhc26_02.mp4',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            duration: 2840,
            fileSize: '780 MB',
            status: 'PENDING',
            uploadedAt: '2026.10.27 19:55',
            updatedAt: '2026.10.27 19:55',
            reviews: [],
            subtitles: [],
            pipeline: {
              jobId: 'job-dhc-02',
              overallProgress: 100,
              currentStage: '검수 대기',
              stages: []
            }
          }
        ]
      },
      {
        id: 'sess-dhc-03',
        title: '지속가능경영 보고서 프레임워크',
        videoCount: 1,
        videos: [
          {
            id: 'dhc26_03',
            weekId: 1,
            weekTitle: 'Bio Health 시대의 ESG와 지속 가능한 성장',
            sessionTitle: '지속가능경영 보고서 프레임워크',
            fileName: 'dhc26_03.mp4',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            duration: 3100,
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
              stages: []
            }
          }
        ]
      },
      {
        id: 'sess-dhc-04',
        title: 'Bio Health 산업의 환경경영(E)',
        videoCount: 1,
        videos: [
          {
            id: 'dhc26_04',
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
              stages: []
            }
          }
        ]
      },
      {
        id: 'sess-dhc-05',
        title: 'ESG 거버넌스와 윤리경영(G)',
        videoCount: 1,
        videos: [
          {
            id: 'dhc26_05',
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
              stages: []
            }
          }
        ]
      },
      {
        id: 'sess-dhc-06',
        title: 'Bio Health 기업의 ESG 평가 대응',
        videoCount: 1,
        videos: [
          {
            id: 'dhc26_06',
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
              stages: []
            }
          }
        ]
      }
    ]
  }
];
