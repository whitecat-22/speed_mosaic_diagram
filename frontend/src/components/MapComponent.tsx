import React, { useEffect } from 'react';
import Map, { NavigationControl } from 'react-map-gl/maplibre';
import type { MapProps } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';

// (Style JSONの定義は変更なし)
// --- 1. 国土地理院地図の定義 ---
const gsiPaleTileUrl = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
const gsiAttribution = '地理院タイル';
const gsiPaleStyle: MapProps['mapStyle'] = {
  version: 8,
  sources: { 'gsi-raster-tiles': { type: 'raster', tiles: [gsiPaleTileUrl], tileSize: 256, attribution: gsiAttribution } },
  layers: [ { id: 'gsi-raster-layer', type: 'raster', source: 'gsi-raster-tiles' } ],
};
// --- 2. OpenStreetMapの定義 ---
const osmTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const osmAttribution = '© OpenStreetMap contributors';
const osmStyle: MapProps['mapStyle'] = {
  version: 8,
  sources: { 'osm-raster-tiles': { type: 'raster', tiles: [osmTileUrl], tileSize: 256, attribution: osmAttribution } },
  layers: [ { id: 'osm-raster-layer', type: 'raster', source: 'osm-raster-tiles' } ],
};
// --- 3. baseMapsの定義を更新 ---
const baseMaps = {
  gsi: gsiPaleStyle,
  osm: osmStyle,
};
// 関東の初期ビューポート
const INITIAL_VIEW_STATE = {
  longitude: 139.7671, // 東京駅
  latitude: 35.6812,
  zoom: 10,
};
// (Propsの定義は変更なし)
interface Props {
  baseMapKey: 'gsi' | 'osm';
  children?: React.ReactNode;
  onClick: (evt: any) => void;
}


const MapComponent: React.FC<Props> = ({ baseMapKey, children, onClick }) => {

  // (ロギングは残しておきます)
  console.log(`MapComponent: Render (key: ${baseMapKey})`);
  useEffect(() => {
    console.log(`%cMapComponent: Mounted (key: ${baseMapKey})`, 'color: green;');
    return () => {
      console.log(`%cMapComponent: Unmounting (key: ${baseMapKey})`, 'color: red;');
    };
  }, [baseMapKey]);

  return (
    <Map
      initialViewState={INITIAL_VIEW_STATE}
      style={{ width: '100%', height: '100%' }}
      key={baseMapKey}
      mapStyle={baseMaps[baseMapKey]}
      mapLib={import('maplibre-gl')}
      onClick={onClick}
      reuseMaps={true}
      onError={(e) => {
        console.error('%cMapComponent: MapLibreライブラリからエラー', 'background: red; color: white;', e.error);
      }}
      // マップ操作
      dragPan={true}
      dragRotate={true}
      scrollZoom={true}
      touchZoom={true}
      touchRotate={true}
      doubleClickZoom={true}
    >
      <NavigationControl
        position="top-right"
        showPitch={true}
      />

      {children}
    </Map>
  );
};

// React.memo でコンポーネントをラップ
export default React.memo(MapComponent);
