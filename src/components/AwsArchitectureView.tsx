import React, { useState } from 'react';
import {
  Cloud,
  Server,
  Database,
  Cpu,
  Shield,
  Layers,
  Copy,
  Check,
  Code2,
  HardDrive,
  Radio,
  FileCode
} from 'lucide-react';

export const AwsArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'diagram' | 'iac'>('diagram');
  const [copied, setCopied] = useState(false);

  const samTemplate = `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Enterprise Video Review & Inspection Serverless Architecture

Globals:
  Function:
    Timeout: 30
    MemorySize: 1024
    Runtime: nodejs20.x
    Environment:
      Variables:
        VIDEO_TABLE: !Ref VideoReviewTable
        UPLOAD_BUCKET: !Ref VideoSourceBucket

Resources:
  # 1. CloudFront + S3 Static Portal Hosting
  PortalBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'video-review-portal-\${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # 2. Raw Video Storage Bucket with EventBridge Notifications
  VideoSourceBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'video-review-source-\${AWS::AccountId}'
      NotificationConfiguration:
        EventBridgeConfiguration:
          EventBridgeEnabled: true

  # 3. High-Throughput DynamoDB for QA Metadata & Timecode Reviews
  VideoReviewTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: VideoReviewEntities
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: PK
          AttributeType: S
        - AttributeName: SK
          AttributeType: S
        - AttributeName: GSI1PK
          AttributeType: S
      KeySchema:
        - AttributeName: PK
          KeyType: HASH
        - AttributeName: SK
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: GSI_Status
          KeySchema:
            - AttributeName: GSI1PK
              KeyType: HASH
          Projection:
            ProjectionType: ALL

  # 4. Media Pipeline Orchestrator Lambda
  MediaPipelineFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/lambdas/orchestrator/
      Handler: index.handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref VideoReviewTable
        - S3ReadPolicy:
            BucketName: !Ref VideoSourceBucket
      Events:
        S3NewVideoEvent:
          Type: CloudWatchEvent
          Properties:
            Pattern:
              source:
                - aws.s3
              detail-type:
                - Object Created

  # 5. Gemini 3.8 Flash Subtitles & Translation Function
  AiSubtitlesFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/lambdas/ai-subtitles/
      Handler: index.handler
      Timeout: 120
      MemorySize: 2048
      Environment:
        Variables:
          GEMINI_API_KEY: '{{resolve:secretsmanager:GeminiApiKey}}'
`;

  const copyIac = () => {
    navigator.clipboard.writeText(samTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cloud className="w-5 h-5 text-amber-500" />
            <span>AWS 기반 서버리스 아키텍처 설계 (Architecture Blueprint)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            대용량 동영상 업로드, 분산 트랜스코딩, AI 자막 생성 및 실시간 검수를 위한 고가용성·무중단 서버리스 설계입니다.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('diagram')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
              activeTab === 'diagram' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            아키텍처 다이어그램
          </button>
          <button
            onClick={() => setActiveTab('iac')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'iac' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>AWS SAM / IaC 코드</span>
          </button>
        </div>
      </div>

      {activeTab === 'diagram' ? (
        <div className="space-y-6">
          
          {/* Visual Architecture Map */}
          <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
            <div className="min-w-[720px] space-y-8">
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-bold tracking-wider uppercase text-amber-400 font-mono">
                  AWS Serverless Event-Driven Pipeline
                </span>
                <span className="text-xs text-slate-400">Zero-Server Management · Multi-AZ Fault Tolerance</span>
              </div>

              {/* Pipeline Flow Diagram */}
              <div className="grid grid-cols-4 gap-4 text-center">
                
                {/* Step 1: Ingestion */}
                <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">1. S3 Presigned Upload</h4>
                  <p className="text-[11px] text-slate-400 mt-1">대용량 파일 브라우저 직접 전송 (Multipart)</p>
                  <div className="mt-3 px-2 py-0.5 bg-amber-950 text-amber-300 rounded text-[10px] font-mono">
                    Bucket + EventBridge
                  </div>
                </div>

                {/* Step 2: Orchestration */}
                <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center mb-2">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">2. Lambda & MediaConvert</h4>
                  <p className="text-[11px] text-slate-400 mt-1">1080p/720p ABR 인코딩 및 썸네일 추출</p>
                  <div className="mt-3 px-2 py-0.5 bg-orange-950 text-orange-300 rounded text-[10px] font-mono">
                    H.264 / AAC Preset
                  </div>
                </div>

                {/* Step 3: AI Processing */}
                <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                    <Radio className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">3. Gemini 3.8 Flash</h4>
                  <p className="text-[11px] text-slate-400 mt-1">음성 타임코드 추출 및 한국어/영어 자막 번역</p>
                  <div className="mt-3 px-2 py-0.5 bg-blue-950 text-blue-300 rounded text-[10px] font-mono">
                    AI Speech Engine
                  </div>
                </div>

                {/* Step 4: Storage & Delivery */}
                <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                    <Database className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">4. DynamoDB & CloudFront</h4>
                  <p className="text-[11px] text-slate-400 mt-1">Single-Table 메타데이터 및 글로벌 CDN 배포</p>
                  <div className="mt-3 px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[10px] font-mono">
                    On-Demand Billing
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Architectural Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>무한 확장성 (Auto Scaling)</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                수십 기가바이트의 교육 동영상이 동시에 업로드되어도 S3와 AWS MediaConvert가 병렬로 자동 분산 처리하여 서버 병목이 발생하지 않습니다.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>비용 효율성 (Pay-Per-Use)</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                검수 요청이 없는 시간대에는 인프라 유지 비용이 0원에 수렴하며, 영상이 등록될 때만 Lambda 및 MediaConvert 연산 비용이 밀리초 단위로 청구됩니다.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>안정적인 오프라인/동기화</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                DynamoDB의 조건부 쓰기와 클라이언트의 IndexedDB 오프라인 캐시가 결합되어 네트워크 단절 상태에서도 안전하게 의견을 작성하고 동기화할 수 있습니다.
              </p>
            </div>
          </div>

        </div>
      ) : (
        /* IaC View */
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="font-mono text-xs text-slate-300 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-amber-400" /> template.yaml (AWS Serverless Application Model)
            </span>

            <button
              onClick={copyIac}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사됨' : 'YAML 복사'}</span>
            </button>
          </div>

          <pre className="p-6 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[500px]">
            {samTemplate}
          </pre>
        </div>
      )}

    </div>
  );
};
