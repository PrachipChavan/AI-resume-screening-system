import os
import sys
import subprocess

def run_command(command, shell=False):
    print(f"Running command: {' '.join(command) if isinstance(command, list) else command}")
    result = subprocess.run(command, shell=shell)
    if result.returncode != 0:
        print(f"Error: Command failed with code {result.returncode}")
        sys.exit(result.returncode)

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Define paths
    venv_dir = os.path.join(base_dir, ".venv")
    
    # Detect platform paths
    if sys.platform == "win32":
        python_exe = os.path.join(venv_dir, "Scripts", "python.exe")
        pip_exe = os.path.join(venv_dir, "Scripts", "pip.exe")
    else:
        python_exe = os.path.join(venv_dir, "bin", "python")
        pip_exe = os.path.join(venv_dir, "bin", "pip")

    # 1. Create virtual environment if it doesn't exist
    if not os.path.exists(venv_dir):
        print("Creating virtual environment...")
        run_command([sys.executable, "-m", "venv", venv_dir])
    else:
        print("Virtual environment already exists.")

    # 2. Upgrade pip
    print("Upgrading pip...")
    run_command([python_exe, "-m", "pip", "install", "--upgrade", "pip"])

    # 3. Install requirements
    requirements_file = os.path.join(base_dir, "requirements.txt")
    print("Installing requirements from requirements.txt...")
    run_command([pip_exe, "install", "-r", requirements_file])

    # 4. Generate samples
    print("Generating sample resumes and job descriptions...")
    generate_script = os.path.join(base_dir, "generate_samples.py")
    run_command([python_exe, generate_script])

    # 5. Start FastAPI application using uvicorn
    print("\nStarting AI Resume Screening System...")
    print("Open http://localhost:8000 in your browser to view the application.\n")
    
    # We run uvicorn module as a command
    run_command([python_exe, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"])

if __name__ == "__main__":
    main()
