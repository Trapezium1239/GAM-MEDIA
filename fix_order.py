from docx import Document
from docx.oxml.ns import qn

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# The issue: chapters were inserted in reverse order before references
# Current order: Ch6, Ch5, Ch4, References, Appendix
# Should be: Ch4, Ch5, Ch6, References, Appendix

# Let's rebuild the document in correct order by extracting and reordering
# Actually, easier: just fix the ordering by moving elements

# Find key elements
ch4_start = ch4_end = ch5_start = ch5_end = ch6_start = ch6_end = ref_start = app_start = None

for i, p in enumerate(doc.paragraphs):
    text = p.text.strip()
    if text == 'CHAPTER FOUR':
        ch4_start = i
    elif text == 'CHAPTER FIVE' and ch5_start is None:
        ch5_start = i
    elif text == 'CHAPTER SIX' and ch6_start is None:
        ch6_start = i
    elif text == 'REFERENCE':
        ref_start = i
    elif text == 'APPENDIX':
        app_start = i

# Find chapter ends (next chapter start or references)
if ch4_start and ch5_start:
    ch4_end = ch5_start - 1
if ch5_start and ch6_start:
    ch5_end = ch6_start - 1
if ch6_start and ref_start:
    ch6_end = ref_start - 1
if ref_start and app_start:
    ref_end = app_start - 1

print(f'Ch4: {ch4_start}-{ch4_end}')
print(f'Ch5: {ch5_start}-{ch5_end}')
print(f'Ch6: {ch6_start}-{ch6_end}')
print(f'Ref: {ref_start}-{ref_end}')
print(f'App: {app_start}-end')

# The chapters are currently in order: Ch6, Ch5, Ch4 (reverse of what we want)
# We need to reorder them to: Ch4, Ch5, Ch6
# Since they're all before references, we can extract and reinsert

# Get the parent element
parent = doc.paragraphs[0]._element.getparent()

# Extract chapter elements
def get_elements(start_idx, end_idx):
    elements = []
    for i in range(start_idx, end_idx + 1):
        if i < len(doc.paragraphs):
            elements.append(doc.paragraphs[i]._element)
    return elements

ch4_elements = get_elements(ch4_start, ch4_end)
ch5_elements = get_elements(ch5_start, ch5_end)
ch6_elements = get_elements(ch6_start, ch6_end)

# Remove them from current positions
for el in ch4_elements + ch5_elements + ch6_elements:
    parent.remove(el)

# Reinsert in correct order before references
ref_element = doc.paragraphs[ref_start]._element

# Insert Ch6 first (will be last before ref), then Ch5, then Ch4 (will be first before ref)
for elements in [ch6_elements, ch5_elements, ch4_elements]:
    for el in reversed(elements):
        ref_element.addprevious(el)

# Also fix the empty heading artifacts at the end
# Find and remove empty heading paragraphs after appendix
for i in range(len(doc.paragraphs) - 1, 530, -1):
    if i < len(doc.paragraphs):
        p = doc.paragraphs[i]
        if p.style.name.startswith('Heading') and not p.text.strip():
            parent.remove(p._element)

doc.save(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')
print('Chapter order fixed')