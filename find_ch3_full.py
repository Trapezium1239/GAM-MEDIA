from docx import Document

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# First, let's see the full structure around Chapter 3
for i, p in enumerate(doc.paragraphs):
    if 115 <= i <= 170:
        try:
            text = p.text[:150].encode('ascii', 'replace').decode('ascii')
            print(f'Para {i}: [{p.style.name}] {text}')
        except:
            print(f'Para {i}: [{p.style.name}] <encoding error>')