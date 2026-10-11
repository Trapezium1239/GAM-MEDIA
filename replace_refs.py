from docx import Document
from docx.shared import Pt
from harvard_refs import HARVARD_REFS

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Find the REFERENCE heading and all subsequent paragraphs until end
ref_start = None
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == 'REFERENCE':
        ref_start = i
        break

if ref_start is None:
    print('REFERENCE heading not found!')
    exit(1)

print(f'Reference section starts at para {ref_start}')

# Remove all paragraphs from ref_start to end
# We'll rebuild the reference section
# First, get the parent element
ref_heading = doc.paragraphs[ref_start]._element
parent = ref_heading.getparent()

# Remove all following siblings until end
# Actually, let's just clear the text of the reference paragraphs and rebuild

# Find all reference paragraphs (from ref_start to end)
ref_paras = []
for i, p in enumerate(doc.paragraphs):
    if i >= ref_start:
        ref_paras.append(p)

print(f'Found {len(ref_paras)} reference paragraphs to replace')

# Clear all reference paragraphs except the heading
for p in ref_paras[1:]:  # Skip heading
    p.clear()

# Now add Harvard references after the heading
# We'll insert new paragraphs after the heading
last_element = ref_heading
for ref_text in HARVARD_REFS:
    new_p = doc.add_paragraph(ref_text)
    new_p.style = doc.styles['Normal']
    new_p.paragraph_format.space_after = Pt(6)
    new_p.paragraph_format.line_spacing = 1.15
    new_p.paragraph_format.left_indent = Pt(36)
    new_p.paragraph_format.first_line_indent = Pt(-36)  # Hanging indent
    last_element.addnext(new_p._element)
    last_element = new_p._element

doc.save(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')
print('Harvard references added successfully')