# AI-resume-screening-system
<img width="1911" height="905" alt="image" src="https://github.com/user-attachments/assets/2cdb8ac4-4356-4aa4-ab95-41cebb7215e7" />
# Screener.AI - Intelligent AI Resume Screening System

Screener.AI is a highly polished, interactive web application designed to help recruiters parse, evaluate, and rank resumes (PDF, DOCX, TXT) against target Job Descriptions (JD). Leveraging the **Google Gemini API**, the system performs deep semantic matching, extracts key candidate metadata, analyzes skill gaps, and generates custom interview questions.

---

## 🚀 Key Features

* **Dual Evaluation Engines**:
  * **Gemini AI Mode**: Connects to the Gemini API (e.g. `gemini-1.5-flash`) to generate structured JSON feedback containing strengths, weaknesses, missing skills, and custom interview questions.
  * **Local Offline Fallback**: Runs automatically if no API Key is provided. Uses local heuristic keyword frequency and regex analysis to score candidates, keeping the app 100% functional offline.
* **Premium User Interface**: Modern dark/light glassmorphic layout, stats cards, live search, and match-level filtering (Strong, Potential, Low).
* **Sliding Analysis Panel**: View detailed candidate summaries, check visual alignment bars, review matched vs. missing skills tags, and inspect tailored interview questions.
* **Preloaded Server Samples**: Instantly load and test matching, partially matching, or non-matching resumes with a single click (no downloads required).
* **Custom Match Weights**: Adjust matching priority sliders for Skills, Experience, Education, and Culture/Other.
* **Report Exports**: Download granular evaluations as `.json` files or export fully formatted candidate profiles to PDF via browser print layouts.

---

## 📂 Project Structure

```text
resume-screener/
├── backend/
│   ├── main.py            # FastAPI router, API endpoints, and static server setup
│   ├── parser.py          # PDF, DOCX, and TXT text extraction algorithms
│   ├── schemas.py         # Pydantic schemas enforcing Structured Gemini JSON outputs
│   └── screener.py        # Gemini API connector & local matching fallback engine
├── frontend/
│   ├── index.html         # Responsive dashboard dashboard HTML
│   ├── style.css          # Premium CSS styling (glassmorphism details & light/dark theme)
│   └── app.js             # Client-side state, queue managers, and API triggers
├── samples/               # Mock data generated automatically on first startup
│   ├── job_descriptions/  # Sample Job Descriptions (.txt)
│   └── resumes/           # Sample Candidate Resumes (.pdf)
├── requirements.txt       # Python backend dependencies
├── generate_samples.py    # ReportLab script generating PDF resumes and text JDs
├── run.py                 # Virtualenv setup and server launcher script
└── README.md              # Project documentation
