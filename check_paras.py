from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Check paragraphs around the target areas
for i, p in enumerate(doc.paragraphs):
    if 20 <= i <= 30:
        print(f'Para {i}: [{p.style.name}] {p.text[:100]}')