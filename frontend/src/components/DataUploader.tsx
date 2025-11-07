import React, { useState } from 'react';

const DataUploader: React.FC = () => {
  const [probeFile, setProbeFile] = useState<File | null>(null);
  const [linksFile, setLinksFile] = useState<File | null>(null);
  
  const handleUpload = async (file: File | null, type: 'probe' | 'links') => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data_type', type); // どのデータかを示す文字列

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

  return (
    <div>
      <h4>3. データのアップロード</h4>
      <div>
        <label>自動車プローブデータ: </label>
        <input type="file" onChange={(e) => setProbeFile(e.target.files ? e.target.files[0] : null)} />
        <button onClick={() => handleUpload(probeFile, 'probe')}>Upload</button>
      </div>
      <div>
        <label>道路リンクデータ: </label>
        <input type="file" onChange={(e) => setLinksFile(e.target.files ? e.target.files[0] : null)} />
        <button onClick={() => handleUpload(linksFile, 'links')}>Upload</button>
      </div>
    </div>
  );
};

export default DataUploader;
