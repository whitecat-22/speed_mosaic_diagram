# routing.py

import geopandas as gpd
import networkx as nx
import os
from shapely.geometry import Point, LineString

def find_route(link_data_path: str, start_lonlat: list, end_lonlat: list, vias: list = None):
    """
    ダミーの経路探索関数。
    実際にはここでgeopandas/networkxを使い、SHPファイルからグラフを構築し、
    最近傍ノード探索と最短経路探索（Dijkstraなど）を実行します。
    
    ここでは、単純に起点と終点を結ぶ直線とダミーのリンクIDリストを返します。
    """
    print(f"経路探索 (ダミー) を実行中: {start_lonlat} -> {end_lonlat}")

    # 1. 道路リンクデータの存在確認（ダミー）
    if not os.path.exists(link_data_path):
        # main.py側でチェック済みだが、念のため
        print(f"警告: {link_data_path} が見つかりません。")
        # raise FileNotFoundError(f"道路リンクデータ {link_data_path} が見つかりません。")
    
    # 2. ダミーのGeoJSONを作成
    # 実際には探索結果の経路ジオメトリ
    points = [start_lonlat] + (vias or []) + [end_lonlat]
    route_geometry = LineString(points)
    
    dummy_geojson = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": list(route_geometry.coords)
        },
        "properties": {
            "name": "ダミー経路"
        }
    }

    # 3. ダミーのリンクIDリストを作成
    # 実際には探索結果の経路を構成するリンクのIDリスト
    dummy_link_ids = ["link_dummy_1", "link_dummy_2", "link_dummy_3"]

    print("経路探索 (ダミー) 完了。")

    return {
        "geojson": dummy_geojson,
        "link_ids": dummy_link_ids
    }

if __name__ == '__main__':
    # モジュール単体でのテスト用
    dummy_path = "./uploads/links.shp"
    start = [139.7671, 35.6812] # 東京駅
    end = [139.6917, 35.6895]   # 新宿駅
    
    # ダミーファイルを作成
    os.makedirs("./uploads", exist_ok=True)
    try:
        # geopandasがインストールされていればダミーSHPを作成
        gpd.GeoDataFrame(
            {'id': [1], 'geometry': [LineString([(0,0), (1,1)])]}, 
            crs="EPSG:4326"
        ).to_file(dummy_path, driver='ESRI Shapefile')
        print(f"ダミーの {dummy_path} を作成しました。")
    except Exception as e:
        print(f"ダミーの {dummy_path} の作成に失敗しました (geopandasが必要): {e}")
        # geopandasがなくても動作確認できるよう、空ファイルを作成
        if not os.path.exists(dummy_path):
             open(dummy_path, 'a').close()
             print(f"空の {dummy_path} を作成しました。")

    route_result = find_route(dummy_path, start, end)
    print("\n--- 経路探索結果 ---")
    print(f"GeoJSON: {route_result['geojson']['geometry']['type']}")
    print(f"Links: {route_result['link_ids']}")
