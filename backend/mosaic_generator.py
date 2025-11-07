# mosaic_generator.py

import matplotlib
matplotlib.use('Agg') # GUIバックエンドなしで動作させる
import matplotlib.pyplot as plt
import os
import time

def create_mosaic_image(
    job_id: str,
    link_data_path: str,
    probe_data_path: str,
    route_link_ids: list,
    route_geojson: dict,
    params: dict,
    data_credits: str,
    output_path: str,
    job_store: dict
):
    """
    ダミーのモザイク図作成関数。
    実際にはここでpandas/geopandas/pysparkを使い、プローブデータを集計し、
    matplotlibのpcolormeshでヒートマップを描画します。
    
    ここでは、ジョブIDとパラメータをテキストで描画したダミー画像を生成します。
    """
    print(f"[Job: {job_id}] モザイク図作成 (ダミー) を開始します...")
    print(f"[Job: {job_id}] 出力先: {output_path}")

    try:
        # --- 1. データの存在確認（ダミー） ---
        if not os.path.exists(link_data_path):
             print(f"[Job: {job_id}] 警告: リンクデータ {link_data_path} が見つかりません。")
        if not os.path.exists(probe_data_path):
             print(f"[Job: {job_id}] 警告: プローブデータ {probe_data_path} が見つかりません。")

        # --- 2. 重い処理をシミュレート ---
        time.sleep(3) # 3秒待機

        # --- 3. ダミー画像 (PNG) を作成 ---
        fig, ax = plt.subplots(figsize=(10, 5))
        
        # 描画するテキスト情報
        info_text = f"平均旅行速度モザイク図 (ダミー)\n\n"
        info_text += f"Job ID: {job_id}\n"
        info_text += f"対象期間: {params.get('date_str', 'N/A')}\n"
        info_text += f"時間ピッチ: {params.get('time_pitch', 'N/A')} 分\n"
        info_text += f"対象リンク数: {len(route_link_ids)} \n"
        info_text += f"使用データ: {data_credits}\n\n"
        info_text += f"処理ステータス: 成功 (ダミー)"

        ax.text(0.5, 0.5, info_text, 
                ha='center', va='center', 
                fontsize=12, 
                bbox=dict(boxstyle="round,pad=1", fc="wheat", alpha=0.5))
        
        ax.set_title("ダミー路線図")
        ax.set_xlabel("距離")
        ax.set_ylabel("時間")
        ax.grid(True)
        
        # 実際のモザイク図の代わりにダミーの線を描画
        ax.plot([0, 10], [0, 10], 'r--')
        ax.plot([0, 10], [10, 0], 'b--')

        plt.tight_layout()
        fig.savefig(output_path)
        plt.close(fig)

        # --- 4. ジョブステータスを更新 ---
        if job_id in job_store:
            job_store[job_id]["status"] = "COMPLETED"
        
        print(f"[Job: {job_id}] モザイク図作成 (ダミー) が完了しました。")

    except Exception as e:
        print(f"[Job: {job_id}] エラー: モザイク図の作成に失敗しました: {e}")
        if job_id in job_store:
            job_store[job_id]["status"] = "FAILED"

if __name__ == '__main__':
    # モジュール単体でのテスト用
    dummy_job_id = "test-job-123"
    dummy_output_dir = "./outputs"
    dummy_output_path = os.path.join(dummy_output_dir, f"mosaic_{dummy_job_id}.png")
    
    os.makedirs(dummy_output_dir, exist_ok=True)
    
    dummy_jobs = {
        dummy_job_id: {
            "status": "RUNNING",
            "path": dummy_output_path,
            "filename": f"mosaic_{dummy_job_id}.png"
        }
    }
    
    print("--- モザイク生成 (単体テスト) 開始 ---")
    create_mosaic_image(
        job_id=dummy_job_id,
        link_data_path="./uploads/links.shp",
        probe_data_path="./uploads/probe.csv",
        route_link_ids=["link_A", "link_B"],
        route_geojson={"type": "LineString", "coordinates": [[0,0], [1,1]]},
        params={"date_str": "2025-11-07", "time_pitch": "60"},
        data_credits="Test Data",
        output_path=dummy_output_path,
        job_store=dummy_jobs
    )
    
    print("\n--- モザイク生成 (単体テスト) 結果 ---")
    print(f"ジョブステータス: {dummy_jobs[dummy_job_id]['status']}")
    print(f"ファイル生成確認: {os.path.exists(dummy_output_path)}")
