from docx import Document

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Find Chapter 3 structure
for i, p in enumerate(doc.paragraphs):
    if p.text.startswith('Chapter Three') or p.text.startswith('3.') or 'Methodology' in p.text or 'Ethical' in p.text or 'Data Analysis' in p.text or 'Validity' in p.text:
        print(f'Para {i}: [{p.style.name}] {p.text[:120]}')