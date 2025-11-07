// App.tsx
import React, { useState, useRef, useEffect } from 'react';
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';

// --- CSS ---
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css'; // 修正した App.css をインポート

// --- 作成したコンポーネント ---
import MapComponent from './components/MapComponent';
import ParameterSelector from './components/ParameterSelector';
import DataUploader from './components/DataUploader';
import GenerationManager from './components/GenerationManager';

// (型定義は省略)
interface RouteData { geojson: any; link_ids: string[]; }
interface MosaicParams {
  startDate: Date | null;
  endDate: Date | null;
  timePitch: string;
  date_str: string;
}

function App() {
  // (State定義は省略)
  const [baseMapKey, setBaseMapKey] = useState<'gsi' | 'osm'>('osm');
  const [clicks, setClicks] = useState<number[][]>([]);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [mosaicParams, setMosaicParams] = useState<MosaicParams>({
     startDate: new Date(),
     endDate: null,
     timePitch: '60',
     date_str: new Date().toISOString().split('T')[0],
  });

  // (ロギング用RefとEffectは省略)
  const mapContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // ... (ロギングコード) ...
  }, []);

  // (ハンドラ関数 fetchRoute, handleMapClick は省略)
  const handleMapClick = (evt: any) => {
    if (clicks.length >= 2) {
      setClicks([evt.lngLat]);
      setRouteData(null);
    } else {
      setClicks([...clicks, evt.lngLat]);
    }
  };
  const fetchRoute = async () => { /* ... (省略) ... */ };

  // (Deck.gl レイヤー定義は省略)
  const routeLayer = new GeoJsonLayer({ /* ... (省略) ... */ });

  // --- レンダリング ---
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>

      {/* === 左側: コントロールパネル === */}
      <div style={{
            width: '400px',
            padding: '10px',
            overflowY: 'auto',
            background: '#f8f8f8',
            zIndex: 1,
            borderRight: '1px solid #ccc',

            // ★修正点: 文字色を暗い色に固定
            color: '#213547'
         }}
      >
        <h2>速度モザイク図ツール</h2>

        <hr />
        <h4>0. ベース地図レイヤ</h4>
        <select value={baseMapKey} onChange={(e) => setBaseMapKey(e.target.value as 'gsi' | 'osm')} style={{width: '100%'}}>
          <option value="gsi">国土地理院地図</option>
          <option value="osm">OpenStreetMap</option>
        </select>

        <hr />
        <h4>1. 対象路線の選択</h4>
        <p>地図上で起点→終点の順に2点クリックしてください。</p>
        <button onClick={fetchRoute} disabled={clicks.length < 2} style={{width: '100%'}}>
          経路探索を実行
        </button>
        {routeData && <p style={{color: 'green', fontWeight: 'bold'}}>✓ 経路探索完了！</p>}

        <hr />

        <ParameterSelector />

        <hr />

        <DataUploader />

        <hr />

        <GenerationManager
          routeData={routeData}
          params={mosaicParams}
        />
      </div>

      {/* === 右側: 地図 === */}
      <div ref={mapContainerRef} style={{ flex: 1, position: 'relative' }}>
        <MapComponent baseMapKey={baseMapKey} onClick={handleMapClick}>
          <DeckGL
            layers={[routeLayer]}
            getTooltip={({object}) => object && object.properties?.name}
          />
        </MapComponent>
      </div>
    </div>
  );
}

export default App;
