"""
Resume Screening AI - Demo Application
======================================

Demonstrates the complete workflow with sample data
"""

from core.resume_screening_ai import (
    ResumeScreeningAI,
    ResumeScreeningVisualizer,
    print_results_table
)

# --------------------------------------------------
# Sample Job Description
# --------------------------------------------------

job_description = """
Senior Machine Learning Engineer

Requirements:
- 5+ years of experience in machine learning
- Strong Python programming skills
- Experience with TensorFlow, PyTorch, Scikit-learn
- Knowledge of NLP and deep learning
- Cloud platforms (AWS/GCP/Azure)
- Masters or PhD in Computer Science
"""

# --------------------------------------------------
# Sample Resumes
# --------------------------------------------------

resumes = [

    {
        'name': 'Aditya',
        'text': 'PhD in CS, 7 years ML experience, Python expert, TensorFlow, PyTorch...'
    },

    {
        'name': 'Vansh',
        'text': 'Bachelors in Statistics, 4 years data analytics, Python, SQL...'
    },

    {
        'name': 'Aman',
        'text': 'Masters in AI, 6 years ML, Python, TensorFlow, NLP expert...'
    }

]

# --------------------------------------------------
# Run the Screening System
# --------------------------------------------------

ai = ResumeScreeningAI()

ai.load_job_description(job_description)

ai.load_resumes(resumes)

results = ai.calculate_final_scores()

# --------------------------------------------------
# Display Results
# --------------------------------------------------

print_results_table(results)

# --------------------------------------------------
# Generate Visualizations
# --------------------------------------------------

viz = ResumeScreeningVisualizer(ai)

viz.plot_candidate_rankings(
    save_path='rankings.png'
)

viz.generate_summary_report(
    save_path='summary.png'
)

# --------------------------------------------------
# Export Results
# --------------------------------------------------

results.to_csv(
    'results.csv',
    index=False
)

print("Complete!!!!!!!!!!!!")
