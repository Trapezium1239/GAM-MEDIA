from docx import Document
from docx.shared import Pt
from docx.oxml.ns import qn

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Research Questions to insert after para 21
research_questions = [
    "1. What is the baseline level of depression literacy among religious educators in Ibadan, Oyo State?",
    "2. What is the effect of the mental health training programme on religious educators' depression literacy (knowledge and attitudes) immediately post-training?",
    "3. What is the effect of the training programme on religious educators' perceived confidence in identifying adolescents with depression and willingness to refer them for professional care?",
    "4. What is the level of satisfaction of religious educators with the mental health training programme?"
]

# Hypotheses to replace paras 24-25
hypotheses = [
    "H1: Religious educators who complete the mental health training programme will demonstrate significantly higher depression literacy scores (knowledge and attitudes) at post-test compared to pre-test (p < 0.05, one-tailed).",
    "H2: Religious educators who complete the training programme will report significantly higher perceived confidence in identifying adolescents with depression at post-test compared to pre-test (p < 0.05, one-tailed).",
    "H3: Religious educators who complete the training programme will report significantly higher willingness to refer adolescents with depression for professional care at post-test compared to pre-test (p < 0.05, one-tailed).",
    "H4: Religious educators' satisfaction with the training programme will be positively associated with the magnitude of improvement in depression literacy scores (p < 0.05)."
]

# Insert research questions after para 21 (index 21)
# We need to insert at the XML level
# Para 21 is "This study will address the following research questions:"
# Insert new paragraphs after it

# Get the paragraph element for para 21
p21 = doc.paragraphs[21]._element

# Insert research questions after p21
for i, rq in enumerate(research_questions):
    new_p = doc.add_paragraph(rq)
    new_p.style = doc.styles['Normal']
    new_p.alignment = 0  # Justify
    # Move the new paragraph to after p21
    p21.addnext(new_p._element)
    p21 = new_p._element  # Update for next insertion

# Replace para 24 ("Knowledge") and para 25 ("Identification") with hypotheses
# Para 24 is at index 24, para 25 at index 25
# But after inserting 4 paragraphs, indices have shifted
# Let's find them by content

# Actually, let's just modify the text of paras 24 and 25 and add two more
# After our insertions, the original para 24 is now at index 24+4 = 28
# Let's find "Knowledge" and "Identification"

for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == 'Knowledge':
        p.text = hypotheses[0]
        print(f'Replaced para {i}: Knowledge -> H1')
    elif p.text.strip() == 'Identification':
        p.text = hypotheses[1]
        print(f'Replaced para {i}: Identification -> H2')

# Now we need to add H3 and H4 after the modified para 25 (now H2)
# Find the H2 paragraph
for i, p in enumerate(doc.paragraphs):
    if p.text.strip().startswith('H2:'):
        p_h2 = p._element
        # Add H3 and H4 after H2
        for hyp in hypotheses[2:]:
            new_p = doc.add_paragraph(hyp)
            new_p.style = doc.styles['Normal']
            new_p.alignment = 0
            p_h2.addnext(new_p._element)
            p_h2 = new_p._element
        break

doc.save(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')
print('Document updated with research questions and hypotheses')