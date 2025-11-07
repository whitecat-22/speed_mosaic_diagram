import React, { useState } from 'react';

const DataUploader: React.FC = () => {
  const [probeFile, setProbeFile] = useState<File | null>(null);
  const [linksFile, setLinksFile] = useState<File | null>(null);

  const handleUpload = async (file: File | null, type: 'probe' | 'links') => {
    if (!file) {
      alert("ファイルが選択されていません。");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('data_type', type);

    try {
      const response = await fetch('http://localhost:8000/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        alert(`${type} データのアップロードに成功しました。`);
      } else {
        const err = await response.json();
        alert(`エラー: ${err.detail}`);
      }
    } catch (error) {
      alert(`アップロード失敗: ${error}`);
    }
  };

  // 自動車プローブデータと道路リンクデータのセクションを
  // それぞれ div で囲み、レイアウトを調整します。
  return (
    <div>
      <h4>4. データのアップロード</h4>

      {/* --- 自動車プローブデータ --- */}
      <div style={{ marginBottom: '15px', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
        <label htmlFor="probe-file-input" style={{ fontWeight: 'bold' }}>
          自動車プローブデータ:
        </label>

        <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
          <input
            id="probe-file-input"
            type="file"
            onChange={(e) => setProbeFile(e.target.files ? e.target.files[0] : null)}
          />
          {/* 選択されたファイル名を表示 */}
          <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#555' }}>
            {/* {probeFile ? probeFile.name : "選択されていません"} */}
          </span>
        </div>

        <button onClick={() => handleUpload(probeFile, 'probe')} style={{ width: '100%' }}>
          Upload
        </button>
      </div>

      {/* --- 道路リンクデータ --- */}
      <div style={{ marginBottom: '15px', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
        <label htmlFor="links-file-input" style={{ fontWeight: 'bold' }}>
          道路リンクデータ:
        </label>

        <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
          <input
            id="links-file-input"
            type="file"
            onChange={(e) => setLinksFile(e.target.files ? e.target.files[0] : null)}
          />
          {/* 選択されたファイル名を表示 */}
          <span style={{ marginLeft: '10px', fontSize: '0.9em', color: '#555' }}>
            {/* {linksFile ? linksFile.name : "選択されていません"} */}
          </span>
        </div>

        <button onClick={() => handleUpload(linksFile, 'links')} style={{ width: '100%' }}>
          Upload
        </button>
      </div>
    </div>
  );
};

export default DataUploader;
