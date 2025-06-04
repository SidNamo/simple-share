from fastapi import FastAPI, Request, UploadFile, File, Form
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
from pathlib import Path
import shutil

UPLOAD_DIR = Path("upload")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    files = os.listdir(UPLOAD_DIR)
    return templates.TemplateResponse("index.html", {"request": request, "files": files})

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": file.filename}

from urllib.parse import unquote

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
