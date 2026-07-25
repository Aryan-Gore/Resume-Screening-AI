"""
Resume Screening AI System
===========================
This system automatically analyzes resumes and compares them with job descriptions
to rank candidates based on their relevance using NLP and ML techniques.
"""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
import matplotlib.pyplot as plt
import seaborn as sns
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import re
import warnings
warnings.filterwarnings('ignore')

# Download required NLTK data
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
except:
    pass


class TextPreprocessor:
    """
    Handles all text preprocessing operations including cleaning,
    tokenization, lemmatization, and stopword removal.
    """
    
    def __init__(self):
        """Initialize preprocessor with lemmatizer and stop words"""
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words('english'))
        
    def clean_text(self, text):
        """
        Clean text by removing special characters, URLs, and extra spaces
        
        Args:
            text (str): Raw text to clean
            
        Returns:
            str: Cleaned text
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+|www\S+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Remove special characters and digits
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Remove extra spaces
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def tokenize_and_lemmatize(self, text):
        """
        Tokenize text and apply lemmatization
        
        Args:
            text (str): Text to process
            
        Returns:
            list: List of lemmatized tokens
        """
        # Tokenize
        tokens = word_tokenize(text)
        
        # Lemmatize and remove stop words
        lemmatized = [
            self.lemmatizer.lemmatize(token)
            for token in tokens
            if token not in self.stop_words and len(token) > 2
        ]
        
        return lemmatized
    
    def preprocess(self, text):
        """
        Complete preprocessing pipeline
        
        Args:
            text (str): Raw text
            
        Returns:
            str: Preprocessed text
        """
        cleaned = self.clean_text(text)
        tokens = self.tokenize_and_lemmatize(cleaned)
        return ' '.join(tokens)


class SkillExtractor:
    """
    Extracts technical and soft skills from text using keyword matching
    and NLP techniques.
    """
    
    def __init__(self):
        """Initialize with predefined skill sets"""
        # Common technical skills
        self.technical_skills = {
            'python', 'java', 'javascript', 'c++', 'sql', 'html', 'css',
            'react', 'angular', 'vue', 'nodejs', 'django', 'flask',
            'machine learning', 'deep learning', 'nlp', 'computer vision',
            'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git',
            'agile', 'scrum', 'devops', 'ci/cd', 'rest api', 'microservices'
        }
        
        # Common soft skills
        self.soft_skills = {
            'leadership', 'communication', 'teamwork', 'problem solving',
            'analytical', 'critical thinking', 'creativity', 'adaptability',
            'time management', 'collaboration', 'presentation', 'negotiation'
        }
    
    def extract_skills(self, text):
        """
        Extract skills from text
        
        Args:
            text (str): Text to analyze
            
        Returns:
            dict: Dictionary containing technical and soft skills found
        """
        text_lower = text.lower()
        
        # Extract technical skills
        found_technical = [
            skill for skill in self.technical_skills
            if skill in text_lower
        ]
        
        # Extract soft skills
        found_soft = [
            skill for skill in self.soft_skills
            if skill in text_lower
        ]
        
        return {
            'technical': found_technical,
            'soft': found_soft,
            'total_count': len(found_technical) + len(found_soft)
        }


class ExperienceAnalyzer:
    """
    Analyzes and extracts experience-related information from resumes
    """
    
    def extract_years_of_experience(self, text):
        """
        Extract years of experience from text
        
        Args:
            text (str): Resume text
            
        Returns:
            float: Estimated years of experience
        """
        # Pattern to match years of experience
        patterns = [
            r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience',
            r'experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)',
            r'(\d+)\+?\s*(?:years?|yrs?)'
        ]
        
        years = []
        text_lower = text.lower()
        
        for pattern in patterns:
            matches = re.findall(pattern, text_lower)
            years.extend([int(match) for match in matches])
        
        # Return maximum years found, or 0 if none
        return max(years) if years else 0.0
    
    def extract_education_level(self, text):
        """
        Extract education level from text
        
        Args:
            text (str): Resume text
            
        Returns:
            str: Education level (PhD, Masters, Bachelors, etc.)
        """
        text_lower = text.lower()
        
        # Education level hierarchy
        if any(word in text_lower for word in ['phd', 'ph.d', 'doctorate']):
            return 'PhD'
        elif any(word in text_lower for word in ['masters', 'master', 'msc', 'm.sc', 'mba', 'mtech', 'm.tech']):
            return 'Masters'
        elif any(word in text_lower for word in ['bachelors', 'bachelor', 'bsc', 'b.sc', 'btech', 'b.tech', 'be', 'b.e']):
            return 'Bachelors'
        elif any(word in text_lower for word in ['diploma', 'associate']):
            return 'Diploma'
        else:
            return 'Other'


class ResumeScreeningAI:
    """
    Main Resume Screening AI system that orchestrates all components
    to analyze, score, and rank candidates.
    """
    
    def __init__(self):
        """Initialize all components of the screening system"""
        self.preprocessor = TextPreprocessor()
        self.skill_extractor = SkillExtractor()
        self.experience_analyzer = ExperienceAnalyzer()
        self.vectorizer = TfidfVectorizer(max_features=500, ngram_range=(1, 2))
        self.scaler = MinMaxScaler()
        
        # Storage for analysis results
        self.resumes_data = None
        self.job_description = None
        self.similarity_scores = None
        self.final_scores = None
        
    def load_job_description(self, job_description_text):
        """
        Load and preprocess job description
        
        Args:
            job_description_text (str): Raw job description text
        """
        self.job_description = {
            'raw': job_description_text,
            'processed': self.preprocessor.preprocess(job_description_text),
            'skills': self.skill_extractor.extract_skills(job_description_text)
        }
        print("Job description loaded and processed successfully")
    
    def load_resumes(self, resumes_list):
        """
        Load and preprocess multiple resumes
        
        Args:
            resumes_list (list): List of dictionaries with 'name' and 'text' keys
        """
        processed_resumes = []
        
        for resume in resumes_list:
            # Preprocess text
            processed_text = self.preprocessor.preprocess(resume['text'])
            
            # Extract skills
            skills = self.skill_extractor.extract_skills(resume['text'])
            
            # Extract experience
            years_exp = self.experience_analyzer.extract_years_of_experience(resume['text'])
            education = self.experience_analyzer.extract_education_level(resume['text'])
            
            processed_resumes.append({
                'name': resume['name'],
                'raw_text': resume['text'],
                'processed_text': processed_text,
                'skills': skills,
                'years_of_experience': years_exp,
                'education': education
            })
        
        self.resumes_data = pd.DataFrame(processed_resumes)
        print(f" {len(resumes_list)} resumes loaded and processed successfully")
    
    def calculate_text_similarity(self):
        """
        Calculate cosine similarity between job description and resumes
        using TF-IDF vectorization
        
        Returns:
            numpy.ndarray: Array of similarity scores
        """
        # Combine job description and resumes for vectorization
        all_texts = [self.job_description['processed']] + \
                    self.resumes_data['processed_text'].tolist()
        
        # Create TF-IDF matrix
        tfidf_matrix = self.vectorizer.fit_transform(all_texts)
        
        # Calculate cosine similarity
        # First row is job description, rest are resumes
        similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])
        
        return similarities[0]
    
    def calculate_skill_match_score(self):
        """
        Calculate skill match score based on overlap with job requirements
        
        Returns:
            numpy.ndarray: Array of skill match scores (0-1)
        """
        job_skills = set(self.job_description['skills']['technical'] + 
                        self.job_description['skills']['soft'])
        
        if len(job_skills) == 0:
            return np.zeros(len(self.resumes_data))
        
        skill_scores = []
        
        for _, row in self.resumes_data.iterrows():
            resume_skills = set(row['skills']['technical'] + 
                              row['skills']['soft'])
            
            # Calculate Jaccard similarity
            if len(resume_skills) == 0:
                score = 0.0
            else:
                intersection = len(job_skills.intersection(resume_skills))
                union = len(job_skills.union(resume_skills))
                score = intersection / union if union > 0 else 0.0
            
            skill_scores.append(score)
        
        return np.array(skill_scores)
    
    def calculate_experience_score(self):
        """
        Calculate experience score based on years of experience
        
        Returns:
            numpy.ndarray: Normalized experience scores (0-1)
        """
        years = self.resumes_data['years_of_experience'].values
        
        # Normalize years (assuming max 20 years as benchmark)
        normalized = np.minimum(years / 20.0, 1.0)
        
        return normalized
    
    def calculate_education_score(self):
        """
        Calculate education score based on education level
        
        Returns:
            numpy.ndarray: Normalized education scores (0-1)
        """
        education_weights = {
            'PhD': 1.0,
            'Masters': 0.8,
            'Bachelors': 0.6,
            'Diploma': 0.4,
            'Other': 0.2
        }
        
        scores = self.resumes_data['education'].map(education_weights).values
        return scores
    
    def calculate_final_scores(self, weights=None):
        """
        Calculate final weighted scores for all candidates
        
        Args:
            weights (dict): Custom weights for different components
                          Default: {'text_similarity': 0.4, 'skill_match': 0.3,
                                   'experience': 0.2, 'education': 0.1}
        
        Returns:
            pandas.DataFrame: DataFrame with all scores and rankings
        """
        if weights is None:
            weights = {
                'text_similarity': 0.4,
                'skill_match': 0.3,
                'experience': 0.2,
                'education': 0.1
            }
        
        # Calculate individual scores
        text_sim = self.calculate_text_similarity()
        skill_match = self.calculate_skill_match_score()
        exp_score = self.calculate_experience_score()
        edu_score = self.calculate_education_score()
        
        # Calculate weighted final score
        final_scores = (
            weights['text_similarity'] * text_sim +
            weights['skill_match'] * skill_match +
            weights['experience'] * exp_score +
            weights['education'] * edu_score
        )
        
        # Create results DataFrame
        results = pd.DataFrame({
            'Candidate': self.resumes_data['name'],
            'Text_Similarity': np.round(text_sim * 100, 2),
            'Skill_Match': np.round(skill_match * 100, 2),
            'Experience_Score': np.round(exp_score * 100, 2),
            'Education_Score': np.round(edu_score * 100, 2),
            'Final_Score': np.round(final_scores * 100, 2),
            'Technical_Skills': self.resumes_data['skills'].apply(lambda x: len(x['technical'])),
            'Soft_Skills': self.resumes_data['skills'].apply(lambda x: len(x['soft'])),
            'Years_Experience': self.resumes_data['years_of_experience'],
            'Education_Level': self.resumes_data['education']
        })
        
        # Rank candidates
        results['Rank'] = results['Final_Score'].rank(ascending=False, method='min').astype(int)
        results = results.sort_values('Rank')
        
        self.final_scores = results
        
        return results
    
    def get_top_candidates(self, n=5):
        """
        Get top N candidates
        
        Args:
            n (int): Number of top candidates to return
            
        Returns:
            pandas.DataFrame: Top N candidates
        """
        if self.final_scores is None:
            raise ValueError("Please run calculate_final_scores() first")
        
        return self.final_scores.head(n)
    
    def generate_candidate_report(self, candidate_name):
        """
        Generate detailed report for a specific candidate
        
        Args:
            candidate_name (str): Name of the candidate
            
        Returns:
            dict: Detailed candidate report
        """
        if self.final_scores is None:
            raise ValueError("Please run calculate_final_scores() first")
        
        candidate_row = self.final_scores[
            self.final_scores['Candidate'] == candidate_name
        ].iloc[0]
        
        resume_data = self.resumes_data[
            self.resumes_data['name'] == candidate_name
        ].iloc[0]
        
        report = {
            'name': candidate_name,
            'rank': int(candidate_row['Rank']),
            'final_score': float(candidate_row['Final_Score']),
            'scores': {
                'text_similarity': float(candidate_row['Text_Similarity']),
                'skill_match': float(candidate_row['Skill_Match']),
                'experience': float(candidate_row['Experience_Score']),
                'education': float(candidate_row['Education_Score'])
            },
            'details': {
                'technical_skills': resume_data['skills']['technical'],
                'soft_skills': resume_data['skills']['soft'],
                'years_of_experience': float(resume_data['years_of_experience']),
                'education_level': resume_data['education']
            }
        }
        
        return report


class ResumeScreeningVisualizer:
    """
    Handles all visualization tasks for the resume screening system
    """
    
    def __init__(self, screening_ai):
        """
        Initialize visualizer with screening AI instance
        
        Args:
            screening_ai (ResumeScreeningAI): Instance of ResumeScreeningAI
        """
        self.ai = screening_ai
        plt.style.use('seaborn-v0_8-darkgrid')
        sns.set_palette("husl")
    
    def plot_candidate_rankings(self, top_n=10, save_path=None):
        """
        Plot horizontal bar chart of top candidates
        
        Args:
            top_n (int): Number of top candidates to show
            save_path (str): Path to save the plot (optional)
        """
        if self.ai.final_scores is None:
            raise ValueError("No scores available. Run calculate_final_scores() first")
        
        top_candidates = self.ai.get_top_candidates(top_n)
        
        plt.figure(figsize=(12, 8))
        colors = plt.cm.viridis(np.linspace(0.3, 0.9, len(top_candidates)))
        
        bars = plt.barh(
            range(len(top_candidates)),
            top_candidates['Final_Score'],
            color=colors
        )
        
        plt.yticks(range(len(top_candidates)), top_candidates['Candidate'])
        plt.xlabel('Final Score (%)', fontsize=12, fontweight='bold')
        plt.ylabel('Candidate', fontsize=12, fontweight='bold')
        plt.title(f'Top {top_n} Candidates Ranking', fontsize=14, fontweight='bold')
        plt.xlim(0, 100)
        
        # Add value labels on bars
        for i, (bar, score) in enumerate(zip(bars, top_candidates['Final_Score'])):
            plt.text(score + 1, bar.get_y() + bar.get_height()/2, 
                    f'{score:.1f}%', va='center', fontsize=10, fontweight='bold')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        
        plt.show()
    
    def plot_score_breakdown(self, candidate_name, save_path=None):
        """
        Plot score breakdown for a specific candidate
        
        Args:
            candidate_name (str): Name of the candidate
            save_path (str): Path to save the plot (optional)
        """
        report = self.ai.generate_candidate_report(candidate_name)
        
        scores = report['scores']
        categories = ['Text\nSimilarity', 'Skill\nMatch', 'Experience', 'Education']
        values = [
            scores['text_similarity'],
            scores['skill_match'],
            scores['experience'],
            scores['education']
        ]
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # Radar chart
        angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
        values_radar = values + [values[0]]
        angles += angles[:1]
        
        ax1 = plt.subplot(121, projection='polar')
        ax1.plot(angles, values_radar, 'o-', linewidth=2, color='#2E86AB')
        ax1.fill(angles, values_radar, alpha=0.25, color='#2E86AB')
        ax1.set_xticks(angles[:-1])
        ax1.set_xticklabels(categories, size=10)
        ax1.set_ylim(0, 100)
        ax1.set_title(f'Score Breakdown: {candidate_name}', 
                     size=12, fontweight='bold', pad=20)
        ax1.grid(True)
        
        # Bar chart
        ax2 = plt.subplot(122)
        colors = ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D']
        bars = ax2.bar(categories, values, color=colors, alpha=0.8)
        ax2.set_ylabel('Score (%)', fontsize=11, fontweight='bold')
        ax2.set_title('Component Scores', fontsize=12, fontweight='bold')
        ax2.set_ylim(0, 100)
        
        # Add value labels
        for bar, value in zip(bars, values):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 2,
                    f'{value:.1f}%', ha='center', va='bottom', 
                    fontsize=10, fontweight='bold')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        
        plt.show()
    
    def plot_skills_comparison(self, top_n=5, save_path=None):
        """
        Compare skills across top candidates
        
        Args:
            top_n (int): Number of top candidates to compare
            save_path (str): Path to save the plot (optional)
        """
        if self.ai.final_scores is None:
            raise ValueError("No scores available. Run calculate_final_scores() first")
        
        top_candidates = self.ai.get_top_candidates(top_n)
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # Technical skills comparison
        x = np.arange(len(top_candidates))
        width = 0.35
        
        ax1.bar(x, top_candidates['Technical_Skills'], width, 
               label='Technical', color='#2E86AB', alpha=0.8)
        ax1.bar(x + width, top_candidates['Soft_Skills'], width,
               label='Soft', color='#A23B72', alpha=0.8)
        
        ax1.set_xlabel('Candidate', fontsize=11, fontweight='bold')
        ax1.set_ylabel('Number of Skills', fontsize=11, fontweight='bold')
        ax1.set_title('Skills Comparison - Top Candidates', fontsize=12, fontweight='bold')
        ax1.set_xticks(x + width / 2)
        ax1.set_xticklabels(top_candidates['Candidate'], rotation=45, ha='right')
        ax1.legend()
        ax1.grid(axis='y', alpha=0.3)
        
        # Experience and Education
        ax2_twin = ax2.twinx()
        
        line1 = ax2.plot(x, top_candidates['Years_Experience'], 
                        marker='o', linewidth=2, markersize=8,
                        color='#F18F01', label='Years Experience')
        bars = ax2_twin.bar(x, top_candidates['Education_Score'],
                           alpha=0.5, color='#C73E1D', label='Education Score')
        
        ax2.set_xlabel('Candidate', fontsize=11, fontweight='bold')
        ax2.set_ylabel('Years of Experience', fontsize=11, fontweight='bold', color='#F18F01')
        ax2_twin.set_ylabel('Education Score (%)', fontsize=11, fontweight='bold', color='#C73E1D')
        ax2.set_title('Experience & Education - Top Candidates', fontsize=12, fontweight='bold')
        ax2.set_xticks(x)
        ax2.set_xticklabels(top_candidates['Candidate'], rotation=45, ha='right')
        ax2.tick_params(axis='y', labelcolor='#F18F01')
        ax2_twin.tick_params(axis='y', labelcolor='#C73E1D')
        
        # Combine legends
        lines1, labels1 = ax2.get_legend_handles_labels()
        lines2, labels2 = ax2_twin.get_legend_handles_labels()
        ax2.legend(lines1 + lines2, labels1 + labels2, loc='upper left')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        
        plt.show()
    
    def plot_score_distribution(self, save_path=None):
        """
        Plot distribution of final scores across all candidates
        
        Args:
            save_path (str): Path to save the plot (optional)
        """
        if self.ai.final_scores is None:
            raise ValueError("No scores available. Run calculate_final_scores() first")
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Final Score Distribution
        axes[0, 0].hist(self.ai.final_scores['Final_Score'], bins=15, 
                       color='#2E86AB', alpha=0.7, edgecolor='black')
        axes[0, 0].axvline(self.ai.final_scores['Final_Score'].mean(), 
                          color='red', linestyle='--', linewidth=2, label='Mean')
        axes[0, 0].set_xlabel('Final Score (%)', fontweight='bold')
        axes[0, 0].set_ylabel('Frequency', fontweight='bold')
        axes[0, 0].set_title('Final Score Distribution', fontweight='bold', fontsize=12)
        axes[0, 0].legend()
        axes[0, 0].grid(alpha=0.3)
        
        # Text Similarity Distribution
        axes[0, 1].hist(self.ai.final_scores['Text_Similarity'], bins=15,
                       color='#A23B72', alpha=0.7, edgecolor='black')
        axes[0, 1].axvline(self.ai.final_scores['Text_Similarity'].mean(),
                          color='red', linestyle='--', linewidth=2, label='Mean')
        axes[0, 1].set_xlabel('Text Similarity (%)', fontweight='bold')
        axes[0, 1].set_ylabel('Frequency', fontweight='bold')
        axes[0, 1].set_title('Text Similarity Distribution', fontweight='bold', fontsize=12)
        axes[0, 1].legend()
        axes[0, 1].grid(alpha=0.3)
        
        # Skill Match Distribution
        axes[1, 0].hist(self.ai.final_scores['Skill_Match'], bins=15,
                       color='#F18F01', alpha=0.7, edgecolor='black')
        axes[1, 0].axvline(self.ai.final_scores['Skill_Match'].mean(),
                          color='red', linestyle='--', linewidth=2, label='Mean')
        axes[1, 0].set_xlabel('Skill Match (%)', fontweight='bold')
        axes[1, 0].set_ylabel('Frequency', fontweight='bold')
        axes[1, 0].set_title('Skill Match Distribution', fontweight='bold', fontsize=12)
        axes[1, 0].legend()
        axes[1, 0].grid(alpha=0.3)
        
        # Box plot of all score components
        score_components = self.ai.final_scores[[
            'Text_Similarity', 'Skill_Match', 'Experience_Score', 'Education_Score'
        ]].values
        
        bp = axes[1, 1].boxplot(score_components, labels=[
            'Text\nSimilarity', 'Skill\nMatch', 'Experience', 'Education'
        ], patch_artist=True)
        
        colors = ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D']
        for patch, color in zip(bp['boxes'], colors):
            patch.set_facecolor(color)
            patch.set_alpha(0.7)
        
        axes[1, 1].set_ylabel('Score (%)', fontweight='bold')
        axes[1, 1].set_title('Score Component Comparison', fontweight='bold', fontsize=12)
        axes[1, 1].grid(alpha=0.3, axis='y')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        
        plt.show()
    
    def generate_summary_report(self, save_path=None):
        """
        Generate comprehensive visual summary report
        
        Args:
            save_path (str): Path to save the report (optional)
        """
        if self.ai.final_scores is None:
            raise ValueError("No scores available. Run calculate_final_scores() first")
        
        fig = plt.figure(figsize=(20, 12))
        gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
        
        # 1. Top 10 Rankings
        ax1 = fig.add_subplot(gs[0:2, 0])
        top10 = self.ai.get_top_candidates(10)
        colors = plt.cm.viridis(np.linspace(0.3, 0.9, len(top10)))
        bars = ax1.barh(range(len(top10)), top10['Final_Score'], color=colors)
        ax1.set_yticks(range(len(top10)))
        ax1.set_yticklabels(top10['Candidate'])
        ax1.set_xlabel('Final Score (%)', fontweight='bold')
        ax1.set_title('Top 10 Candidates', fontweight='bold', fontsize=13)
        ax1.invert_yaxis()
        for i, (bar, score) in enumerate(zip(bars, top10['Final_Score'])):
            ax1.text(score + 1, bar.get_y() + bar.get_height()/2,
                    f'{score:.1f}%', va='center', fontsize=9, fontweight='bold')
        
        # 2. Score Distribution
        ax2 = fig.add_subplot(gs[0, 1])
        ax2.hist(self.ai.final_scores['Final_Score'], bins=15,
                color='#2E86AB', alpha=0.7, edgecolor='black')
        ax2.axvline(self.ai.final_scores['Final_Score'].mean(),
                   color='red', linestyle='--', linewidth=2)
        ax2.set_xlabel('Final Score (%)', fontweight='bold')
        ax2.set_ylabel('Frequency', fontweight='bold')
        ax2.set_title('Score Distribution', fontweight='bold', fontsize=13)
        
        # 3. Skills Comparison
        ax3 = fig.add_subplot(gs[0, 2])
        top5 = self.ai.get_top_candidates(5)
        x = np.arange(len(top5))
        width = 0.35
        ax3.bar(x, top5['Technical_Skills'], width, label='Technical', 
               color='#2E86AB', alpha=0.8)
        ax3.bar(x + width, top5['Soft_Skills'], width, label='Soft',
               color='#A23B72', alpha=0.8)
        ax3.set_xlabel('Candidate', fontweight='bold')
        ax3.set_ylabel('Number of Skills', fontweight='bold')
        ax3.set_title('Top 5 Skills Comparison', fontweight='bold', fontsize=13)
        ax3.set_xticks(x + width / 2)
        ax3.set_xticklabels(top5['Candidate'], rotation=45, ha='right', fontsize=9)
        ax3.legend()
        
        # 4. Component Box Plot
        ax4 = fig.add_subplot(gs[1, 1:])
        score_components = self.ai.final_scores[[
            'Text_Similarity', 'Skill_Match', 'Experience_Score', 'Education_Score'
        ]].values
        bp = ax4.boxplot(score_components, labels=[
            'Text Similarity', 'Skill Match', 'Experience', 'Education'
        ], patch_artist=True)
        colors_box = ['#2E86AB', '#A23B72', '#F18F01', '#C73E1D']
        for patch, color in zip(bp['boxes'], colors_box):
            patch.set_facecolor(color)
            patch.set_alpha(0.7)
        ax4.set_ylabel('Score (%)', fontweight='bold')
        ax4.set_title('Score Components Distribution', fontweight='bold', fontsize=13)
        ax4.grid(alpha=0.3, axis='y')
        
        # 5. Statistics Table
        ax5 = fig.add_subplot(gs[2, :])
        ax5.axis('tight')
        ax5.axis('off')
        
        stats_data = [
            ['Metric', 'Mean', 'Median', 'Std Dev', 'Min', 'Max'],
            ['Final Score',
             f"{self.ai.final_scores['Final_Score'].mean():.2f}",
             f"{self.ai.final_scores['Final_Score'].median():.2f}",
             f"{self.ai.final_scores['Final_Score'].std():.2f}",
             f"{self.ai.final_scores['Final_Score'].min():.2f}",
             f"{self.ai.final_scores['Final_Score'].max():.2f}"],
            ['Text Similarity',
             f"{self.ai.final_scores['Text_Similarity'].mean():.2f}",
             f"{self.ai.final_scores['Text_Similarity'].median():.2f}",
             f"{self.ai.final_scores['Text_Similarity'].std():.2f}",
             f"{self.ai.final_scores['Text_Similarity'].min():.2f}",
             f"{self.ai.final_scores['Text_Similarity'].max():.2f}"],
            ['Skill Match',
             f"{self.ai.final_scores['Skill_Match'].mean():.2f}",
             f"{self.ai.final_scores['Skill_Match'].median():.2f}",
             f"{self.ai.final_scores['Skill_Match'].std():.2f}",
             f"{self.ai.final_scores['Skill_Match'].min():.2f}",
             f"{self.ai.final_scores['Skill_Match'].max():.2f}"]
        ]
        
        table = ax5.table(cellText=stats_data, cellLoc='center', loc='center',
                         colWidths=[0.2, 0.16, 0.16, 0.16, 0.16, 0.16])
        table.auto_set_font_size(False)
        table.set_fontsize(10)
        table.scale(1, 2)
        
        # Style header row
        for i in range(6):
            table[(0, i)].set_facecolor('#2E86AB')
            table[(0, i)].set_text_props(weight='bold', color='white')
        
        # Style data rows
        for i in range(1, 4):
            for j in range(6):
                if i % 2 == 0:
                    table[(i, j)].set_facecolor('#E8E8E8')
        
        plt.suptitle('Resume Screening AI - Comprehensive Analysis Report',
                    fontsize=16, fontweight='bold', y=0.98)
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        
        plt.show()


def print_results_table(results_df):
    """
    Print formatted results table
    
    Args:
        results_df (pandas.DataFrame): Results DataFrame
    """
    print("\n" + "="*120)
    print("RESUME SCREENING RESULTS".center(120))
    print("="*120)
    print(f"{'Rank':<6} {'Candidate':<25} {'Final':<8} {'Text Sim':<10} "
          f"{'Skills':<8} {'Exp':<8} {'Edu':<8} {'Tech Skills':<12} {'Years Exp':<10}")
    print("-"*120)
    
    for _, row in results_df.iterrows():
        print(f"{row['Rank']:<6} {row['Candidate']:<25} {row['Final_Score']:<8.2f} "
              f"{row['Text_Similarity']:<10.2f} {row['Skill_Match']:<8.2f} "
              f"{row['Experience_Score']:<8.2f} {row['Education_Score']:<8.2f} "
              f"{row['Technical_Skills']:<12} {row['Years_Experience']:<10.1f}")
    
    print("="*120 + "\n")


if __name__ == "__main__":
    print("Resume Screening AI System - Initialized")
    print("This module contains all necessary classes and functions.")
    print("\nTo use this system, import the classes and follow the example in demo.py")
