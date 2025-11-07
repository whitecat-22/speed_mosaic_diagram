import React, { useState, useRef, useEffect } from 'react';
import { DeckGL } from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';

// --- CSS ---
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

// --- コンポーネント ---
import MapComponent from './components/MapComponent';
import ParameterSelector from './components/ParameterSelector';
import DataUploader from './components/DataUploader';
import GenerationManager from './components/GenerationManager';

// --- 型定義 ---
interface RouteData { geojson: any; link_ids: string[]; }
interface MosaicParams {
  startDate: Date | null;
  endDate: Date | null;
  timePitch: string;
  date_str: string;
  timeFrom: number;
  timeTo: number;
  selectedDays: Set<string>;
}

function App() {
  // (State定義は変更なし)
  const [baseMapKey, setBaseMapKey] = useState<'gsi' | 'osm'>('osm');
  const [clicks, setClicks] = useState<number[][]>([]);
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  const [mosaicParams, setMosaicParams] = useState<MosaicParams>({
     startDate: new Date(),
     endDate: null,
     selectedDays: new Set(['月', '火', '水', '木', '金']),
     timeFrom: 0,
     timeTo: 23,
     timePitch: '60',
     date_str: new Date().toISOString().split('T')[0],
  });

  // (ロギング用RefとEffectは変更なし)
  const mapContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    console.log("App.tsx: useEffect [監視開始]");
    if (!mapContainerRef.current) {
      console.warn("App.tsx: mapContainerRef.current がマウント時に null です。");
      return;
    }
    console.log(`App.tsx: 初回コンテナサイズ: ${mapContainerRef.current.clientWidth}x${mapContainerRef.current.clientHeight}`);
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        console.log(
          `%cApp.tsx (ResizeObserver): Mapコンテナのサイズが ${width}x${height} に変更されました`,
          'color: blue; font-weight: bold;'
        );
        if (width === 0 || height === 0) {
          console.warn("%cApp.tsx (ResizeObserver): Mapコンテナのサイズが 0 になりました！", 'color: red; font-weight: bold;');
        }
      }
    });
    resizeObserver.observe(mapContainerRef.current);
    return () => {
      console.log("App.tsx: useEffect [監視終了] (クリーンアップ)");
      resizeObserver.disconnect();
    };
  }, []);

  // (ハンドラ関数 fetchRoute, handleMapClick は変更なし)
  const handleMapClick = (evt: any) => {
    if (clicks.length >= 2) {
      setClicks([evt.lngLat]);
      setRouteData(null);
    } else {
      setClicks([...clicks, evt.lngLat]);
    }
  };

  const fetchRoute = async () => {
    if (clicks.length < 2) return;
    try {
      const response = await fetch('http://localhost:8000/api/v1/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: clicks }),
      });
      if (!response.ok) {
         const err = await response.json();
         throw new Error(err.detail || '経路探索に失敗しました');
      }
      const data: RouteData = await response.json();
      setRouteData(data);
    } catch (error: any) {
      console.error("経路探索エラー:", error);
      alert(error.message);
      setClicks([]);
    }
  };

  const routeLayer = new GeoJsonLayer({
    id: 'route-layer',
    data: routeData?.geojson,
    stroked: true,
    getLineColor: [0, 0, 255, 200],
    getLineWidth: 5,
    lineWidthMinPixels: 3,
  });

  // --- レンダリング ---
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>

      {/* === 左側: コントロールパネル === */}
      <div
        style={{
            // ★ 修正: 幅を 360px -> 340px に変更
            width: '340px',
            // ★ 修正: パディングを 10px 15px に変更
            padding: '10px 15px',
            overflowY: 'auto',
            background: '#2d3748',
            color: '#ecf0f1',
            zIndex: 1,
            borderRight: '1px solid #4a5568'
         }}
         className="sidebar-container"
      >
        <h2 style={{ textAlign: 'center', fontSize: '1.7em' }}>速度モザイク図ツール</h2>

        <hr style={{ borderColor: '#4a5568', opacity: 0.5 }} />

        <h4>0. ベース地図レイヤ</h4>
        <select value={baseMapKey} onChange={(e) => setBaseMapKey(e.target.value as 'gsi' | 'osm')} style={{width: '100%'}}>
          <option value="gsi">国土地理院地図</option>
          <option value="osm">OpenStreetMap</option>
        </select>

        <hr style={{ borderColor: '#4a5568', opacity: 0.5 }} />

        <h4>1. 対象路線の選択</h4>
        <p style={{ color: '#bdc3c7', fontSize: '0.9em' }}>
          地図上で起点→終点の順に2点クリックしてください。
        </p>
        <button onClick={fetchRoute} disabled={clicks.length < 2} style={{width: '100%'}}>
          経路探索を実行
        </button>
        {routeData && <p style={{color: '#2ecc71', fontWeight: 'bold'}}>✓ 経路探索完了！</p>}

        <hr style={{ borderColor: '#4a5568', opacity: 0.5 }} />

        <ParameterSelector
          params={mosaicParams}
          setParams={setMosaicParams}
        />

        <hr style={{ borderColor: '#4a5568', opacity: 0.5 }} />

        {/* (DataUploader があれば表示) */}
        {typeof DataUploader !== 'undefined' && <DataUploader />}

        <hr style={{ borderColor: '#4a5568', opacity: 0.5 }} />

        {/* (GenerationManager があれば表示) */}
        {typeof GenerationManager !== 'undefined' && <GenerationManager
          routeData={routeData}
          params={mosaicParams}
        />}
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
