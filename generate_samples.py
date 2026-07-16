import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_dir_if_not_exists(path):
    if not os.path.exists(path):
        os.makedirs(path)
        print(f"Created directory: {path}")

def generate_pdf_resume(filename, name, contact, sections):
    doc = SimpleDocTemplate(filename, pagesize=letter,
                            rightMargin=54, leftMargin=54,
                            topMargin=54, bottomMargin=54)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#2A2D34'),
        spaceAfter=6
    )
    
    contact_style = ParagraphStyle(
        'DocContact',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#666666'),
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E3D59'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#333333'),
        spaceAfter=6
    )

    story = []
    
    # Name
    story.append(Paragraph(name, title_style))
    # Contact Info
    story.append(Paragraph(contact, contact_style))
    story.append(Spacer(1, 10))
    
    # Sections (Summary, Experience, Education, Skills)
    for title, content in sections.items():
        story.append(Paragraph(title, h2_style))
        # Content can be list of items or single string
        if isinstance(content, list):
            for item in content:
                story.append(Paragraph(f"• {item}", body_style))
        else:
            story.append(Paragraph(content, body_style))
        story.append(Spacer(1, 8))
        
    doc.build(story)
    print(f"Generated PDF Resume: {filename}")

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    resumes_dir = os.path.join(base_dir, "samples", "resumes")
    jds_dir = os.path.join(base_dir, "samples", "job_descriptions")
    
    create_dir_if_not_exists(resumes_dir)
    create_dir_if_not_exists(jds_dir)
    
    # --- Write Job Descriptions ---
    jd_python = """Job Title: Senior Python Developer
Location: Remote / Hybrid
Experience: 5+ Years
Salary: $120,000 - $150,000

Job Brief:
We are looking for a Senior Python Developer to build functional and efficient server-side applications. You will participate in all phases of the software development lifecycle, from system architecture design to deployment and optimization.

Key Responsibilities:
- Design and implement scalable backend APIs using FastAPI or Flask.
- Optimize database queries (PostgreSQL, Redis) and structure data schemas.
- Collaborate with frontend developers to integrate user-facing elements with server-side logic.
- Containerize services using Docker and deploy to cloud environments (AWS/GCP).
- Write clean, testable, and documented Python code.
- Mentor junior engineers and conduct code reviews.

Required Skills:
- Professional experience with Python (5+ years) and modern frameworks like FastAPI, Django, or Flask.
- Strong knowledge of SQL, ORMs (SQLAlchemy), and relational databases (PostgreSQL).
- Solid experience with Docker, CI/CD pipelines, and git version control.
- Familiarity with cloud services (AWS EC2, S3, RDS).
- Understanding of security standards and token-based authentication (OAuth2, JWT).
- Strong communication and analytical skills.
- Bachelor's degree in Computer Science, engineering, or related field.
"""
    
    jd_data_scientist = """Job Title: Senior Data Scientist
Location: Bangalore, India / Hybrid
Experience: 3-5 Years
Salary: ₹15L - ₹25L

Job Brief:
We are seeking an analytical and detail-oriented Senior Data Scientist to extract valuable insights from our business data. You will build predictive models, run experiments, and design machine learning pipelines to optimize key product features.

Required Skills:
- Strong proficiency in Python, SQL, and data science libraries (Pandas, NumPy, Scikit-Learn).
- Solid experience building and deploying machine learning models (Regression, Random Forests, XGBoost).
- Experience with deep learning frameworks (TensorFlow or PyTorch) is a plus.
- Good understanding of statistics, hypothesis testing, and A/B testing methodology.
- Experience with data visualization tools (Matplotlib, Seaborn, Tableau).
- MS or PhD in Data Science, Statistics, Mathematics, Computer Science, or equivalent.
"""

    with open(os.path.join(jds_dir, "senior_python_developer.txt"), "w", encoding="utf-8") as f:
        f.write(jd_python.strip())
    with open(os.path.join(jds_dir, "senior_data_scientist.txt"), "w", encoding="utf-8") as f:
        f.write(jd_data_scientist.strip())
        
    print("Generated Job Descriptions.")

    # --- Write Resumes ---
    # 1. Alice Smith (Senior Python Developer - Strong Match)
    alice_sections = {
        "Professional Summary": (
            "Senior Backend Engineer with over 6 years of experience designing, developing, "
            "and maintaining complex server-side applications. Specializing in Python, FastAPI, "
            "microservices architecture, and cloud deployment (AWS). Proven track record of "
            "optimizing backend APIs and managing relational databases at scale."
        ),
        "Skills": [
            "Programming Languages: Python (Expert), JavaScript, SQL",
            "Frameworks & Libraries: FastAPI, Flask, SQLAlchemy, Celery",
            "Databases: PostgreSQL, Redis, MongoDB",
            "DevOps & Tools: Docker, AWS (S3, EC2, RDS), Git, GitHub Actions, CI/CD",
            "Methodologies: Agile/Scrum, Rest API Design, Test-Driven Development (TDD)"
        ],
        "Work Experience": [
            "Senior Backend Developer | TechFlow Solutions (2022 - Present)\n"
            "- Led a team of 4 developers to redesign a legacy monolithic architecture into scalable microservices using FastAPI, reducing response times by 40%.\n"
            "- Managed PostgreSQL database scaling, schema design, and query optimization for high-throughput services.\n"
            "- Created automated deployment pipelines using GitHub Actions and Docker, reducing deployment time from hours to minutes.",
            
            "Software Engineer | AppForge Corp (2020 - 2022)\n"
            "- Designed and implemented robust RESTful APIs in Python using Flask, serving 100k+ active daily users.\n"
            "- Integrated third-party payment gateways (Stripe, PayPal) and secured communication using OAuth2/JWT tokens.\n"
            "- Wrote comprehensive unit and integration tests using Pytest, boosting code coverage to 92%."
        ],
        "Education": [
            "B.S. in Computer Science | University of Maryland (2016 - 2020)\n"
            "Honors: Magna Cum Laude"
        ]
    }
    generate_pdf_resume(
        os.path.join(resumes_dir, "alice_smith_python_developer.pdf"),
        "Alice Smith",
        "Email: alice.smith@email.com | Phone: (555) 123-4567 | Portfolio: github.com/alicesmith",
        alice_sections
    )

    # 2. Bob Johnson (Data Scientist - Partial Match for Python Developer, Excellent for Data Scientist)
    bob_sections = {
        "Professional Summary": (
            "Data Scientist with 4 years of experience analyzing complex datasets, "
            "engineering features, and training machine learning models. Highly skilled in Python, "
            "SQL, and statistical analysis. Passionate about turning raw data into actionable "
            "business recommendations."
        ),
        "Skills": [
            "Languages: Python, SQL, R",
            "Data & ML Libraries: Pandas, NumPy, Scikit-Learn, XGBoost, Matplotlib, Seaborn",
            "ML Ops & Frameworks: PyTorch, Docker, Git",
            "Key Domains: Predictive Modeling, A/B Testing, Feature Engineering, Regression Analysis"
        ],
        "Work Experience": [
            "Data Scientist | DataPulse Analytics (2022 - Present)\n"
            "- Built a customer churn prediction model using XGBoost, increasing customer retention by 15%.\n"
            "- Engineered automated data pipelines in Python for clean ETL processing from PostgreSQL databases.\n"
            "- Designed and analyzed A/B test experiments for new product features, communicating results directly to product leads.",
            
            "Junior Data Analyst | InsightTech (2021 - 2022)\n"
            "- Conducted SQL queries to extract data for weekly executive reporting, uncovering key growth metrics.\n"
            "- Created interactive data dashboards using Tableau and Matplotlib for the marketing team."
        ],
        "Education": [
            "M.S. in Data Science | Boston University (2019 - 2021)",
            "B.S. in Statistics | Boston University (2015 - 2019)"
        ]
    }
    generate_pdf_resume(
        os.path.join(resumes_dir, "bob_johnson_data_scientist.pdf"),
        "Bob Johnson",
        "Email: bob.johnson@email.com | Phone: (555) 987-6543 | LinkedIn: linkedin.com/in/bobjohnson",
        bob_sections
    )

    # 3. Charlie Brown (Marketing Specialist - Low Match)
    charlie_sections = {
        "Professional Summary": (
            "Creative and analytical Marketing Specialist with over 5 years of experience in "
            "digital advertising, search engine optimization (SEO), and social media strategy. "
            "Proven ability to manage campaigns, drive organic traffic, and increase brand awareness."
        ),
        "Skills": [
            "Marketing: SEO, SEM, Content Marketing, Email Campaigns, Social Media Strategy",
            "Tools: Google Analytics, Google Ads, HubSpot, Mailchimp, WordPress",
            "Creatives: Canva, Adobe Photoshop (basic), Copywriting"
        ],
        "Work Experience": [
            "Digital Marketing Specialist | GrowthMedia Group (2021 - Present)\n"
            "- Managed an annual ad spend budget of $50k across Google Ads and Meta, achieving a 3.5x ROAS.\n"
            "- Increased organic web traffic by 45% in 12 months through targeted SEO keyword optimization and content strategy.\n"
            "- Orchestrated email marketing campaigns resulting in a consistent 22% open rate.",
            
            "Marketing Coordinator | BrandVibe Ltd (2019 - 2021)\n"
            "- Maintained company social media channels, growing follower count by 30%.\n"
            "- Wrote copy for promotional flyers, blog posts, and monthly client newsletters."
        ],
        "Education": [
            "B.A. in Communications | Syracuse University (2015 - 2019)"
        ]
    }
    generate_pdf_resume(
        os.path.join(resumes_dir, "charlie_brown_marketing.pdf"),
        "Charlie Brown",
        "Email: charlie.brown@email.com | Phone: (555) 456-7890 | Website: charliebrownmarketing.com",
        charlie_sections
    )

if __name__ == "__main__":
    main()
