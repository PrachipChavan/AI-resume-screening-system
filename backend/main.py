import os
import json
from typing import List
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.parser import extract_text
from backend.screener import screen_resume_with_gemini
from backend.schemas import ScreenResult, CandidateEvaluation

app = FastAPI(title="AI Resume Screening API", version="1.0.0")

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAMPLES_DIR = os.path.join(BASE_DIR, "samples")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

class ScreenSamplesRequest(BaseModel):
    filenames: List[str]
    job_description: str
    weights: dict
    api_key: str = None

@app.get("/api/samples")
def get_samples():
    """Returns lists of pre-loaded sample job descriptions and resumes."""
    jds_path = os.path.join(SAMPLES_DIR, "job_descriptions")
    resumes_path = os.path.join(SAMPLES_DIR, "resumes")
    
    samples = {
        "job_descriptions": [],
        "resumes": []
    }
    
    # Read JDs
    if os.path.exists(jds_path):
        for file in os.listdir(jds_path):
            if file.endswith(".txt"):
                file_path = os.path.join(jds_path, file)
                title = file.replace(".txt", "").replace("_", " ").title()
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    samples["job_descriptions"].append({
                        "id": file,
                        "title": title,
                        "content": content
                    })
                except Exception as e:
                    print(f"Error reading JD {file}: {e}")
                    
    # Read Resumes metadata
    if os.path.exists(resumes_path):
        for file in os.listdir(resumes_path):
            if file.endswith((".pdf", ".docx", ".txt")):
                display_name = file.replace("_", " ").title()
                # Clean up display name
                for ext in [".Pdf", ".Docx", ".Txt"]:
                    display_name = display_name.replace(ext, "")
                
                samples["resumes"].append({
                    "filename": file,
                    "display_name": display_name
                })
                
    return samples

@app.post("/api/screen", response_model=List[ScreenResult])
async def screen_resumes(
    files: List[UploadFile] = File(...),
    job_description: str = Form(...),
    weights: str = Form(...),
    api_key: str = Form(None)
):
    """Parses and screens uploaded resume files."""
    # Parse weights JSON
    try:
        weights_dict = json.loads(weights)
    except Exception:
        weights_dict = {"skills": 0.4, "experience": 0.3, "education": 0.2, "other": 0.1}

    results = []
    for file in files:
        try:
            # Read file bytes
            file_bytes = await file.read()
            # Extract text
            resume_text = extract_text(file.filename, file_bytes)
            
            # Screen with Gemini or local fallback
            evaluation = screen_resume_with_gemini(
                resume_text=resume_text,
                job_description=job_description,
                weights=weights_dict,
                api_key=api_key
            )
            
            results.append(ScreenResult(
                filename=file.filename,
                status="success",
                evaluation=evaluation
            ))
        except Exception as e:
            results.append(ScreenResult(
                filename=file.filename,
                status="error",
                error_message=str(e)
            ))
            
    return results

@app.post("/api/screen-samples", response_model=List[ScreenResult])
def screen_samples(request: ScreenSamplesRequest):
    """Screens selected pre-loaded sample resumes directly from the server storage."""
    resumes_path = os.path.join(SAMPLES_DIR, "resumes")
    results = []
    
    for filename in request.filenames:
        # Prevent directory traversal attacks
        safe_filename = os.path.basename(filename)
        file_path = os.path.join(resumes_path, safe_filename)
        
        if not os.path.exists(file_path):
            results.append(ScreenResult(
                filename=safe_filename,
                status="error",
                error_message="Sample file not found on server."
            ))
            continue
            
        try:
            # Read bytes
            with open(file_path, "rb") as f:
                file_bytes = f.read()
                
            # Extract text
            resume_text = extract_text(safe_filename, file_bytes)
            
            # Screen with Gemini
            evaluation = screen_resume_with_gemini(
                resume_text=resume_text,
                job_description=request.job_description,
                weights=request.weights,
                api_key=request.api_key
            )
            
            results.append(ScreenResult(
                filename=safe_filename,
                status="success",
                evaluation=evaluation
            ))
        except Exception as e:
            results.append(ScreenResult(
                filename=safe_filename,
                status="error",
                error_message=str(e)
            ))
            
    return results

# Mount static frontend directory at the root
if os.path.exists(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    print(f"Warning: Frontend directory '{FRONTEND_DIR}' not found. Static files will not be served.")
