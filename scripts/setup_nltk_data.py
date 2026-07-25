"""
setup_nltk_data.py
===================
Run this ONCE after installing requirements.txt, before starting the app:

    python setup_nltk_data.py

resume_screening_ai.py already tries to download its NLTK data on import,
but it silently swallows any failure (a bare `except: pass`), which means
a flaky connection can leave the app half-configured and only fail later,
mid-request, when a resume is being processed. This script does the same
downloads up front with visible success/failure output, so problems show
up immediately instead of during someone's first analysis.
"""

import nltk

# punkt/punkt_tab: sentence + word tokenizer models (word_tokenize)
# stopwords: common-word list removed during preprocessing
# wordnet + omw-1.4: lemmatizer dictionaries (WordNetLemmatizer)
# averaged_perceptron_tagger(_eng): POS tagger data some NLTK versions
#   pull in as a dependency of tokenization/lemmatization
PACKAGES = [
    'punkt',
    'punkt_tab',
    'stopwords',
    'wordnet',
    'omw-1.4',
    'averaged_perceptron_tagger',
    'averaged_perceptron_tagger_eng',
]

print('Downloading NLTK data used by TextPreprocessor...\n')

failures = []
for pkg in PACKAGES:
    try:
        nltk.download(pkg, quiet=True)
        print(f'  [ok]   {pkg}')
    except Exception as exc:
        failures.append(pkg)
        print(f'  [FAIL] {pkg} -> {exc}')

print()
if failures:
    print(f'{len(failures)} package(s) failed to download: {", ".join(failures)}')
    print('Some of these are version-specific aliases and may not exist for your')
    print('NLTK version - that is usually fine as long as punkt/stopwords/wordnet succeeded above.')
else:
    print('All NLTK data downloaded successfully. You can now run: python app.py')
