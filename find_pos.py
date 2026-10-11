from docx import Document

# Load the existing document
doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Find the position after "1.5 Research Questions" to insert questions
# and after "1.6 Research Hypothesis" to insert hypotheses

# First, let's see the paragraph structure
for i, p in enumerate(doc.paragraphs):
    if '1.5 Research Questions' in p.text:
        print(f'Para {i}: {p.text}')
    if '1.6 Research Hypothesis' in p.text:
        print(f'Para {i}: {p.text}')
    if '1.7 Significance' in p.text:
        print(f'Para {i}: {p.text}')