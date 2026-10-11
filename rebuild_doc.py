from docx import Document
from docx.oxml.ns import qn

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Find all chapter start positions
chapters = {}
for i, p in enumerate(doc.paragraphs):
    text = p.text.strip()
    if text in ['CHAPTER FOUR', 'CHAPTER FIVE', 'CHAPTER SIX', 'REFERENCE', 'APPENDIX']:
        chapters[text] = i

print(f'Chapter positions: {chapters}')

# Current order: Ch4 (246), Ref (247), Ch6 (303), Ch5 (333), App (402)
# Desired order: Ch4, Ch5, Ch6, Ref, App

# Get parent
parent = doc.paragraphs[0]._element.getparent()

# Extract elements for each section
def extract_section(start_idx, end_idx):
    elements = []
    for i in range(start_idx, end_idx):
        if i < len(doc.paragraphs):
            elements.append(doc.paragraphs[i]._element)
    return elements

# Section boundaries
ch4_start = chapters['CHAPTER FOUR']
ref_start = chapters['REFERENCE']
ch6_start = chapters['CHAPTER SIX']
ch5_start = chapters['CHAPTER FIVE']
app_start = chapters['APPENDIX']

# Extract all sections
ch4_elements = extract_section(ch4_start, ref_start)
ref_elements = extract_section(ref_start, ch6_start)
ch6_elements = extract_section(ch6_start, ch5_start)
ch5_elements = extract_section(ch5_start, app_start)
app_elements = extract_section(app_start, len(doc.paragraphs))

print(f'Ch4: {len(ch4_elements)} elements')
print(f'Ref: {len(ref_elements)} elements')
print(f'Ch6: {len(ch6_elements)} elements')
print(f'Ch5: {len(ch5_elements)} elements')
print(f'App: {len(app_elements)} elements')

# Remove all from document
for elements in [ch4_elements, ref_elements, ch6_elements, ch5_elements, app_elements]:
    for el in elements:
        try:
            parent.remove(el)
        except:
            pass

# Reinsert in correct order: Ch4, Ch5, Ch6, Ref, App
# Insert before a marker - we'll use the first paragraph as anchor
anchor = doc.paragraphs[0]._element  # This might be removed, let's find a stable one

# Actually, let's rebuild from scratch - create new document with correct order
# This is cleaner

doc.save(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected_backup.docx')
print('Backup saved, now rebuilding...')