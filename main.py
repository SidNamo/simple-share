from fastapi import FastAPI, Request, UploadFile, File, Form, APIRouter
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
from pathlib import Path
from urllib.parse import unquote
import shutil

router = APIRouter()

UPLOAD_DIR = Path("upload")
UPLOAD_DIR.mkdir(exist_ok=True)

CHUNKS_DIR = UPLOAD_DIR / "chunks"
CHUNKS_DIR.mkdir(exist_ok=True)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    files = [f for f in os.listdir(UPLOAD_DIR) if not (UPLOAD_DIR / f).is_dir()]
    return templates.TemplateResponse("index.html", {"request": request, "files": files})

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": file.filename}

@router.post("/upload-chunk")
async def upload_chunk(
    file: UploadFile,
    filename: str = Form(...),
    chunk_index: int = Form(...),
    total_chunks: int = Form(...),
    upload_id: str = Form(...)
):
    # 업로드 고유 id 별로 디렉터리 생성
    upload_dir = CHUNKS_DIR / upload_id
    upload_dir.mkdir(exist_ok=True)
    chunk_path = upload_dir / f"{chunk_index}.part"
    with open(chunk_path, "wb") as f:
        f.write(await file.read())
    return {"msg": "chunk received"}

@router.post("/merge-chunks")
async def merge_chunks(
    filename: str = Form(...),
    total_chunks: int = Form(...),
    upload_id: str = Form(...)
):
    upload_dir = CHUNKS_DIR / upload_id
    final_path = UPLOAD_DIR / filename
    with open(final_path, "wb") as outfile:
        for i in range(int(total_chunks)):
            chunk_file = upload_dir / f"{i}.part"
            with open(chunk_file, "rb") as infile:
                outfile.write(infile.read())
            os.remove(chunk_file)
    # 디렉터리 정리
    os.rmdir(upload_dir)
    return {"msg": "file merged", "filename": filename}

@app.get("/download/{filename}")
async def download(filename: str):
    decoded_name = unquote(filename)
    file_path = UPLOAD_DIR / decoded_name
    if file_path.exists():
        return FileResponse(file_path, filename=decoded_name)
    return JSONResponse(status_code=404, content={"message": "File not found"})

@app.delete("/delete/{filename}")
async def delete(filename: str):
    decoded_name = unquote(filename)
    file_path = UPLOAD_DIR / decoded_name
    if file_path.exists():
        file_path.unlink()
        return JSONResponse(content={"message": "Deleted"})
    return JSONResponse(status_code=404, content={"message": "Not Found"})

app.include_router(router)
