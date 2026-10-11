from docx import Document

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Find reference section
for i, p in enumerate(doc.paragraphs):
    if p.text.startswith('REFERENCE') or 'Adewunmi' in p.text or 'Afshari' in p.text:
        print(f'Para {i}: [{p.style.name}] {p.text[:200]}')
    if i > 300:
        break