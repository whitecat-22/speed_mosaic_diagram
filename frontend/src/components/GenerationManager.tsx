import React, { useState } from 'react';

// ジョブの状態を管理
interface Job {
  jobId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  fileName: string;
}

// App.tsxから渡されるpropsの型
interface Props {
  routeData: { link_ids: string[], geojson: any } | null;
  params: any; // (ParameterSelectorからのパラメータ)
}

const GenerationManager: React.FC<Props> = ({ routeData, params }) => {
  const [jobs, setJobs] = useState<Job[]>([]);

  // (ポーリング処理)
  const checkJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/mosaic/status/${jobId}`);
      if (!response.ok) {
        // 404 Not Found (ジョブがまだ認識されていない) の場合はリトライ
        if (response.status === 404) {
          console.warn(`Job ${jobId} not found yet, retrying...`);
          setTimeout(() => checkJobStatus(jobId), 5000); // 5秒後に再確認
          return;
        }
        throw new Error('ステータス確認に失敗');
      }

      const data = await response.json();

      let jobStillRunning = false;

      setJobs(prevJobs => prevJobs.map(job => {
        if (job.jobId === jobId) {
          if (data.status === 'RUNNING') {
            jobStillRunning = true;
          }
          return { ...job, status: data.status };
        }
        return job;
      }));

      // 'RUNNING' なら再度ポーリング
      if (jobStillRunning) {
        setTimeout(() => checkJobStatus(jobId), 5000); // 5秒後に再確認
      }

    } catch (error) {
      console.error("ステータス確認エラー:", error);
      // (エラーハンドリング: e.g., ジョブをFAILEDにする)
      setJobs(prevJobs => prevJobs.map(job =>
        job.jobId === jobId ? { ...job, status: 'FAILED' } : job
      ));
    }
  };

  const handleGenerate = async () => {
    if (!routeData) {
      alert("先に対象路線を選択し、経路探索を実行してください。");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/mosaic/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_link_ids: routeData.link_ids,
          route_geojson: routeData.geojson,
          params: params, // 日付、ピッチなど
          data_credits: "使用データ: TomTom + OSM" // (仮)
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || '作成リクエストに失敗しました');
      }

      const jobData = await response.json(); // { job_id: "...", status: "RUNNING", filename: "..." }

      setJobs([...jobs, {
        jobId: jobData.job_id,
        status: jobData.status,
        fileName: jobData.filename
      }]);

      // ポーリングを開始
      setTimeout(() => checkJobStatus(jobData.job_id), 3000); // 3秒後に初回ステータス確認

    } catch (error: any) {
      alert(`作成リクエスト失敗: ${error.message}`);
    }
  };

  return (
    <div>
      <h4>5. モザイク図の作成</h4>
      <button onClick={handleGenerate} disabled={!routeData} style={{width: '100%'}}>
        モザイク図を作成
      </button>

      <h5>作成一覧</h5>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {jobs.length === 0 && <li style={{fontSize: '0.9em', color: '#666'}}>作成ジョブはありません</li>}

        {jobs.map((job) => (
          <li key={job.jobId} style={{ borderBottom: '1px solid #eee', padding: '5px 0' }}>
            <span style={{ fontSize: '0.8em', display: 'block', wordBreak: 'break-all' }}>{job.fileName}</span>
            {job.status === 'RUNNING' && <span style={{ color: 'orange' }}>作成中...</span>}
            {job.status === 'FAILED' && <span style={{ color: 'red' }}>失敗</span>}
            {job.status === 'COMPLETED' && (
              <a
                href={`http://localhost:8000/api/v1/mosaic/download/${job.fileName}`}
                download
                style={{ color: 'green', fontWeight: 'bold' }}
              >
                [ダウンロード]
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GenerationManager;
