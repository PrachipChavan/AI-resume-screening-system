from pydantic import BaseModel, Field
from typing import List, Dict

class MatchScores(BaseModel):
    skills: int = Field(description="Score for skills matching (0-100) based on alignment of keywords, tools, and technical proficiency.")
    experience: int = Field(description="Score for experience matching (0-100) based on roles, seniority, and years of experience.")
    education: int = Field(description="Score for education matching (0-100) based on degree relevancy and field of study.")
    overall: int = Field(description="Overall weighted match score (0-100) based on the user-provided weights.")

class CandidateEvaluation(BaseModel):
    candidate_name: str = Field(description="The candidate's full name extracted from the resume.")
    email: str = Field(description="The email address of the candidate. Return empty string if not found.")
    phone: str = Field(description="The phone number of the candidate. Return empty string if not found.")
    current_title: str = Field(description="The current job title or role of the candidate. Return empty string if not found.")
    skills_matched: List[str] = Field(description="List of skills on the resume that match the job description.")
    skills_missing: List[str] = Field(description="List of crucial skills or requirements from the job description that are missing from the resume.")
    experience_years: float = Field(description="Estimated total years of professional work experience extracted or calculated from the resume.")
    education: str = Field(description="Highest degree and field of study (e.g., B.S. in Computer Science).")
    summary: str = Field(description="A brief 2-3 sentence professional summary of the candidate's background relative to the job.")
    strengths: List[str] = Field(description="Key strengths of the candidate relative to this job description. Focus on projects or specific expertise.")
    weaknesses: List[str] = Field(description="Areas where the candidate falls short, has experience gaps, or lacks required tools.")
    match_scores: MatchScores = Field(description="Calculated fit scores for skills, experience, education, and overall match.")
    recommendation: str = Field(description="Recommendation status. MUST be one of: 'Strong Match', 'Potential Match', or 'Low Match'.")
    suggested_questions: List[str] = Field(description="3 tailored, technical interview questions addressing specific gaps or projects in their resume.")

class ScreenResult(BaseModel):
    filename: str
    status: str # "success" or "error"
    error_message: str = ""
    evaluation: CandidateEvaluation = None
