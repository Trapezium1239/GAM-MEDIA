from docx import Document

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Find the questionnaire sections
for i, p in enumerate(doc.paragraphs):
    text = p.text[:100]
    if 'APPENDIX' in text or 'Sociodemographic' in text or 'Pre- and Post-Training' in text or 'Satisfaction Questionnaire' in text or 'SECTION' in text:
        print(f'Para {i}: [{p.style.name}] {text}')
    if i > 350:
        break