import os
import re
import json
import google.generativeai as genai
from backend.schemas import CandidateEvaluation, MatchScores

def clean_text(text: str) -> str:
    """Basic cleanup of text."""
    return re.sub(r'\s+', ' ', text).strip()

def screen_resume_locally(resume_text: str, job_description: str, weights: dict) -> CandidateEvaluation:
    """
    Fallback local mock screening in case the Gemini API Key is missing or invalid.
    Uses basic heuristic keyword matching to calculate scores and structure a simulated review.
    """
    lines = [line.strip() for line in resume_text.split('\n') if line.strip()]
    
    # 1. Try to extract name (assume first non-empty line is candidate name)
    candidate_name = "Candidate Name"
    if lines:
        for line in lines[:3]:
            # Simple check that it looks like a name (not email/phone/summary)
            if len(line) < 30 and not any(k in line.lower() for k in ['email', 'phone', 'resume', 'cv', '@']):
                candidate_name = line
                break
                
    # 2. Extract email and phone using regex
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text)
    email = email_match.group(0) if email_match else "not.found@example.com"
    
    phone_match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', resume_text)
    phone = phone_match.group(0) if phone_match else "+1 (555) 000-0000"
    
    # 3. Simple keyword matching for skills
    jd_words = set(re.findall(r'\w+', job_description.lower()))
    resume_words = set(re.findall(r'\w+', resume_text.lower()))
    
    # Common tech keywords we can look for
    tech_keywords = [
        'python', 'fastapi', 'flask', 'django', 'postgresql', 'sql', 'docker', 'aws', 'gcp', 'kubernetes',
        'javascript', 'react', 'vue', 'html', 'css', 'git', 'pandas', 'numpy', 'scikit-learn', 'tensorflow',
        'pytorch', 'marketing', 'seo', 'sem', 'analytics', 'tableau', 'excel', 'agile', 'scrum'
    ]
    
    matched_skills = []
    missing_skills = []
    
    # Check JDs requirements vs Resume keywords
    for kw in tech_keywords:
        if kw in jd_words:
            if kw in resume_words:
                matched_skills.append(kw.upper() if len(kw) <= 4 else kw.capitalize())
            else:
                missing_skills.append(kw.upper() if len(kw) <= 4 else kw.capitalize())
                
    # If lists are empty, add generic items
    if not matched_skills:
        matched_skills = ["Documentation", "Communication", "Problem Solving"]
    if not missing_skills:
        missing_skills = ["Advanced Architecture Design", "Cloud Infrastructure Optimization"]

    # 4. Experience estimation from keywords
    years_match = re.findall(r'(\d+)\+?\s*(?:year|yr)s?', resume_text.lower())
    experience_years = 2.0
    if years_match:
        try:
            experience_years = float(max(int(y) for y in years_match))
        except ValueError:
            pass
            
    # 5. Education heuristic
    education = "High School Diploma / General Experience"
    for line in lines:
        if any(edu in line.lower() for edu in ['b.s.', 'bachelor', 'b.a.', 'm.s.', 'master', 'ph.d.', 'phd', 'degree in']):
            education = line
            break
            
    # 6. Basic scoring heuristics
    skills_score = int(min(100, max(20, (len(matched_skills) / max(1, len(matched_skills) + len(missing_skills))) * 100)))
    
    # Experience score based on JDs keyword "5+ years" or "3-5 years"
    jd_exp_match = re.search(r'(\d+)\+?\s*(?:year|yr)s?', job_description.lower())
    required_years = 3.0
    if jd_exp_match:
        required_years = float(jd_exp_match.group(1))
    
    experience_score = int(min(100, max(20, (experience_years / required_years) * 100)))
    
    # Education score
    education_score = 75
    if any(deg in education.lower() for deg in ['master', 'm.s.', 'phd', 'ph.d.']):
        education_score = 95
    elif any(deg in education.lower() for deg in ['bachelor', 'b.s.', 'b.a.']):
        education_score = 85
        
    # Overall score calculation
    w_skills = weights.get('skills', 0.4)
    w_exp = weights.get('experience', 0.3)
    w_edu = weights.get('education', 0.2)
    w_other = weights.get('other', 0.1)
    
    overall_score = int(round(
        (skills_score * w_skills) +
        (experience_score * w_exp) +
        (education_score * w_edu) +
        (80 * w_other)
    ))
    
    recommendation = "Low Match"
    if overall_score >= 80:
        recommendation = "Strong Match"
    elif overall_score >= 60:
        recommendation = "Potential Match"
        
    summary = f"Simulated analysis for {candidate_name}. The candidate possesses key skills in {', '.join(matched_skills[:3])} with {experience_years} years of work experience."
    
    strengths = [
        f"Demonstrates familiarity with core tools: {', '.join(matched_skills[:3])}",
        f"Shows a background in: {education.split('|')[0].strip()}"
    ]
    
    weaknesses = [
        f"Lacks explicitly mentioned skills: {', '.join(missing_skills[:3])}" if missing_skills else "No glaring skill gaps identified.",
        "Local parser has limited context parsing compared to Google Gemini AI."
    ]
    
    suggested_questions = [
        f"Could you elaborate on your experience using {matched_skills[0] if matched_skills else 'your primary tools'} in a production environment?",
        f"How would you address the missing skill set in {missing_skills[0] if missing_skills else 'cloud/system design'}?",
        "Can you walk me through a complex problem you solved in your previous role?"
    ]
    
    return CandidateEvaluation(
        candidate_name=candidate_name,
        email=email,
        phone=phone,
        current_title="Software Professional" if "developer" in resume_text.lower() or "engineer" in resume_text.lower() else "Professional",
        skills_matched=matched_skills,
        skills_missing=missing_skills,
        experience_years=experience_years,
        education=education,
        summary=summary,
        strengths=strengths,
        weaknesses=weaknesses,
        match_scores=MatchScores(
            skills=skills_score,
            experience=experience_score,
            education=education_score,
            overall=overall_score
        ),
        recommendation=recommendation,
        suggested_questions=suggested_questions
    )

def screen_resume_with_gemini(
    resume_text: str,
    job_description: str,
    weights: dict,
    api_key: str = None
) -> CandidateEvaluation:
    """
    Screens a resume against a job description using the Gemini API.
    Enforces structured JSON output matching the CandidateEvaluation schema.
    """
    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        # Key is missing - fall back to local simulated screen
        print("No Gemini API key found. Falling back to Local Heuristic Screener.")
        return screen_resume_locally(resume_text, job_description, weights)
        
    try:
        genai.configure(api_key=api_key)
        
        # Using gemini-1.5-flash which has stable and excellent support for structured output schemas
        model_name = "gemini-1.5-flash"
        
        system_instruction = (
            "You are an expert HR recruitment specialist and AI talent parser. Your task is to evaluate the provided resume "
            "against the given Job Description (JD). Extract structural details from the resume, assess alignment, and score the "
            "candidate objectively from 0 to 100 on Skills, Experience, and Education.\n\n"
            "Calculate the overall score as a weighted average using these weights:\n"
            f"- Skills Weight: {weights.get('skills', 0.4)}\n"
            f"- Experience Weight: {weights.get('experience', 0.3)}\n"
            f"- Education Weight: {weights.get('education', 0.2)}\n"
            f"- Other/Overall Relevancy Weight: {weights.get('other', 0.1)}\n\n"
            "Ensure the output conforms exactly to the JSON schema. Be highly rigorous, analytical, and fair. "
            "Do not hallucinate skills or degrees."
        )
        
        prompt = (
            f"JOB DESCRIPTION:\n{job_description}\n\n"
            f"RESUME TEXT:\n{resume_text}\n\n"
            "Analyze the resume and return a structured JSON response matching the required schema."
        )
        
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_instruction
        )
        
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                response_schema=CandidateEvaluation,
                temperature=0.1
            )
        )
        
        # Load and validate json response
        evaluation_data = json.loads(response.text)
        return CandidateEvaluation(**evaluation_data)
        
    except Exception as e:
        print(f"Gemini API error: {str(e)}. Falling back to Local Heuristic Screener.")
        # Fall back to local screening if the API fails (e.g. rate limit, bad API key)
        local_result = screen_resume_locally(resume_text, job_description, weights)
        local_result.summary = f"[LOCAL FALLBACK - API Error: {str(e)[:60]}...] " + local_result.summary
        return local_result
