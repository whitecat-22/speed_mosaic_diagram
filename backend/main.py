# main.py
import os
import uuid
import uvicorn
import time
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException,
    BackgroundTasks,
    Request
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any

# ... (モジュールのインポート) ...
try:
    import routing
    import mosaic_generator
except ImportError:
    # ... (ダミー関数の定義) ...
    pass

# --- アプリケーション初期化 ---
app = FastAPI(
    title="平均旅行速度モザイク図作成API",
    version="1.0.0"
)

# --- CORS設定 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ★ロギング ミドルウェアの追加 ---
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """
    全てのリクエストをターミナルにログ出力するミドルウェア
    """
    start_time = time.time()

    print("-" * 40)
    print(f"[Log] リクエスト受信: {request.method} {request.url.path}")
    print(f"[Log] クライアント: {request.client.host}:{request.client.port}")

    # 次の処理（実際のエンドポイント）を実行
    response = await call_next(request)

    # 処理時間を計算
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)

    print(f"[Log] レスポンス: {response.status_code} (処理時間: {process_time:.4f}秒)")
    print("-" * 40 + "\n")

    return response

# --- (グローバル変数・設定) ...
UPLOAD_DIR = "./uploads"
OUTPUT_DIR = "./outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
JOBS: Dict[str, Dict[str, Any]] = {}

# --- (Pydanticモデル定義) ...
class RouteRequest(BaseModel):
    points: List[List[float]]
class MosaicRequest(BaseModel):
    route_link_ids: List[str]
    route_geojson: dict
    params: dict
    data_credits: str

# --- APIエンドポイント (各エンドポイントにも簡単なprint文を追加) ---

@app.get("/", summary="APIヘルスチェック")
async def read_root():
    print("[Log] エンドポイント: / (Health Check)")
    return {"status": "OK", "message": "モザイク図作成APIへようこそ"}

@app.post("/api/v1/route", summary="経路探索")
async def get_route(request: RouteRequest):
    print(f"[Log] エンドポイント: /api/v1/route (Points: {len(request.points)})")

    if len(request.points) < 2:
        raise HTTPException(status_code=400, detail="最低2点（起点・終点）が必要です")
    link_data_path = os.path.join(UPLOAD_DIR, "links.shp")
    if not os.path.exists(link_data_path):
        raise HTTPException(status_code=404, detail="道路リンクデータがアップロードされていません (links.shp)")
    try:
        route_data = routing.find_route(
            link_data_path=link_data_path,
            start_lonlat=request.points[0],
            end_lonlat=request.points[-1],
            vias=request.points[1:-1]
        )
        return route_data
    except Exception as e:
        print(f"経路探索エラー: {e}")
        raise HTTPException(status_code=500, detail=f"経路探索中にエラーが発生しました: {e}")

@app.post("/api/v1/upload", summary="データファイルアップロード")
async def upload_data(
    data_type: str = Form(..., description="データの種類 ('probe' または 'links')"),
    file: UploadFile = File(...)
):
    print(f"[Log] エンドポイント: /api/v1/upload (Type: {data_type}, File: {file.filename})")

    if data_type == 'probe':
        file_path = os.path.join(UPLOAD_DIR, "probe.csv")
    elif data_type == 'links':
        file_path = os.path.join(UPLOAD_DIR, "links.shp")
        print(f"警告: 'links' タイプがアップロードされました。関連ファイル (.shx, .dbf, .prj) も必要です。")
    else:
        raise HTTPException(status_code=400, detail="無効な data_type です ('probe' または 'links' を指定してください)")
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ファイルの保存に失敗しました: {e}")
    return {"message": f"ファイル '{file.filename}' が '{data_type}' としてアップロードされました。"}

@app.post("/api/v1/mosaic/generate", summary="モザイク図作成ジョブの開始")
async def generate_mosaic(
    request: MosaicRequest,
    background_tasks: BackgroundTasks
):
    print(f"[Log] エンドポイント: /api/v1/mosaic/generate (Links: {len(request.route_link_ids)})")

    job_id = str(uuid.uuid4())
    output_filename = f"mosaic_{job_id}.png"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    JOBS[job_id] = {"status": "RUNNING", "path": output_path, "filename": output_filename}
    link_data_path = os.path.join(UPLOAD_DIR, "links.shp")
    probe_data_path = os.path.join(UPLOAD_DIR, "probe.csv")
    if not os.path.exists(link_data_path):
        JOBS[job_id]["status"] = "FAILED"
        raise HTTPException(status_code=404, detail="道路リンクデータ (links.shp) が見つかりません。")
    if not os.path.exists(probe_data_path):
        JOBS[job_id]["status"] = "FAILED"
        raise HTTPException(status_code=404, detail="プローブデータ (probe.csv) が見つかりません。")
    background_tasks.add_task(
        mosaic_generator.create_mosaic_image,
        job_id=job_id, link_data_path=link_data_path, probe_data_path=probe_data_path,
        route_link_ids=request.route_link_ids, route_geojson=request.route_geojson,
        params=request.params, data_credits=request.data_credits,
        output_path=output_path, job_store=JOBS
    )
    return {"job_id": job_id, "status": "RUNNING", "filename": output_filename}

@app.get("/api/v1/mosaic/status/{job_id}", summary="ジョブステータスの確認")
async def get_job_status(job_id: str):
    print(f"[Log] エンドポイント: /api/v1/mosaic/status (Job: {job_id})")
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="ジョブが見つかりません")
    return {"job_id": job_id, "status": job["status"]}

@app.get("/api/v1/mosaic/download/{filename}", summary="作成済みモザイク図のダウンロード")
async def download_mosaic(filename: str):
    print(f"[Log] エンドポイント: /api/v1/mosaic/download (File: {filename})")
    if ".." in filename or filename.startswith("/"):
        raise HTTPException(status_code=400, detail="無効なファイル名です")
    path = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")
    return FileResponse(path, media_type='image/png', filename=filename)

# --- サーバー起動 ---
if __name__ == "__main__":
    print("FastAPIサーバーを http://127.0.0.1:8000 で起動します (ロギング有効)")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) # reload=True を推奨
