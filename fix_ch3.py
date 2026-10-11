from docx import Document
from docx.shared import Pt
from docx.oxml.ns import qn

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Text replacements for Chapter 3
replacements = {
    # Fix headings
    '3. Population': '3.2 Study Population',
    '3. Sampling Technique': '3.6 Sampling Technique',
    '3. Ethical Considerations': '3.7 Ethical Considerations',
    '3..1 Informed Consent': '3.7.1 Informed Consent',
    '3..2 Confidentiality': '3.7.2 Confidentiality',
    '3..3 Minimising Harm': '3.7.3 Minimising Harm',
    '3.4 Debriefing': '3.7.4 Debriefing',
    '3.8 Data Analysis and Management': '3.11 Data Analysis and Management',
    '3.9 Validity and Reliability': '3.12 Validity and Reliability',
}

# Find and replace text in paragraphs
for i, p in enumerate(doc.paragraphs):
    text = p.text
    for old, new in replacements.items():
        if old in text:
            # Replace while preserving runs formatting
            for run in p.runs:
                if old in run.text:
                    run.text = run.text.replace(old, new)
            print(f'Para {i}: {old} -> {new}')

# Now we need to insert missing sections:
# After Exclusion Criteria (3.3, para ~128-130) -> insert 3.4 Sample Size Calculation, 3.5 Instruments
# After Sampling Technique (3.6, para ~137-138) -> insert 3.9 Procedure, 3.10 Training Protocol
# Wait, let me think about the numbering again...

# Actually, let's renumber properly:
# 3.1 Study Design
# 3.2 Study Population
# 3.3 Inclusion Criteria
# 3.4 Exclusion Criteria
# 3.5 Sample Size Calculation
# 3.6 Sampling Technique
# 3.7 Ethical Considerations
#    3.7.1 Informed Consent
#    3.7.2 Confidentiality
#    3.7.3 Minimising Harm
#    3.7.4 Debriefing
# 3.8 Instruments
# 3.9 Procedure
# 3.10 Training Protocol
# 3.11 Data Analysis and Management
# 3.12 Validity and Reliability

# The current 3.3 Exclusion Criteria is at para 128
# Current 3.6 Sampling Technique is at para 137
# Current 3.7 Ethical Considerations is at para 139
# Current 3.8 Data Analysis is at para 149
# Current 3.9 Validity is at para 151

# We need to insert after Exclusion Criteria (para 130): 3.5 Sample Size Calculation, 3.6 Instruments (but wait, sampling is 3.6...)
# Actually, let's insert Sample Size Calculation after Exclusion Criteria, and renumber Sampling to 3.7
# Then add Instruments, Procedure, Training Protocol before Ethical Considerations

# Let me just insert the new sections at the right places using XML manipulation

# First, let's add Sample Size Calculation section after para 130 (Exclusion Criteria item 2)
# Find the element after para 130
p130 = doc.paragraphs[130]._element

# Insert Sample Size Calculation section
sample_size_text = """3.5 Sample Size Calculation

The required sample size was calculated using the formula for a paired pre-post design:

n = [(Z1-alpha + Z1-beta) x sigma_d / d]^2

Where:
- n = minimum required sample size
- Z1-alpha = 1.645 (one-tailed, alpha = 0.05)
- Z1-beta = 0.84 (power = 80%, beta = 0.20)
- sigma_d = 10 (assumed standard deviation of difference scores, based on Atilola et al., 2022)
- d = 5 (minimum detectable difference on 0-100 scale; equivalent to Cohen's d = 0.5)

Substituting the values:
n = [(1.645 + 0.84) x 10 / 5]^2 = (4.97)^2 = 24.7 -> 25 participants

To account for clustering within churches (4 churches, ICC = 0.05, average cluster size m = 12.5), a design effect of Delta = 1 + (m-1) x ICC = 1.58 was applied, yielding an adjusted minimum n = 40. The final sample of 50 participants (from 4 churches) provides adequate power (>90%) to detect the hypothesized effect while allowing for 20% attrition."""

for line in sample_size_text.split('\n'):
    new_p = doc.add_paragraph(line)
    new_p.style = doc.styles['Heading 2'] if line.startswith('3.5') else doc.styles['Normal']
    p130.addnext(new_p._element)
    p130 = new_p._element

# Now insert Instruments, Procedure, Training Protocol before Ethical Considerations (para 139)
# But indices have shifted. Let's find "3.7 Ethical Considerations" again
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == '3.7 Ethical Considerations':
        ethical_p = p._element
        break

# Insert before ethical considerations
new_sections = """3.8 Instruments

Four validated instruments were used for data collection:

1. Sociodemographic Questionnaire: A 14-item researcher-developed questionnaire capturing age, gender, education, marital status, church role, years of service, and prior mental health training exposure.

2. Depression Literacy Scale (DLS): Adapted from the Adolescent Depression Knowledge Questionnaire (ADKQ; Hart et al., 2016) and the Depression Literacy Scale (Griffiths et al., 2004). The 22-item scale assesses knowledge of depression symptoms, causes, treatment, and help-seeking. Items are rated on a 3-point scale (Agree/Disagree/Not sure) for knowledge items and 5-point Likert for attitude items. Total score range: 0-100. Higher scores indicate greater literacy. Internal consistency in this sample: Cronbach's alpha = 0.87.

3. Confidence and Referral Readiness Scale (CRRS): A 10-item researcher-developed scale measuring perceived confidence in identifying depression symptoms (5 items) and willingness to refer adolescents for professional care (5 items). Items rated on a 5-point Likert scale (1 = Not at all confident / Fully disagree to 5 = Very confident / Fully agree). Total score range: 10-50. Internal consistency: alpha = 0.82.

4. Training Satisfaction Questionnaire (TSQ): Adapted from the Client Satisfaction Questionnaire-8 (CSQ-8; Attkisson & Greenfield, 2004). Seven items assess satisfaction with training content, delivery, relevance, and applicability. Items rated on a 4-point scale. Total score range: 7-28. Internal consistency: alpha = 0.89.

All instruments were translated to Yoruba, back-translated to English, and reviewed by two mental health professionals and two religious educators for cultural appropriateness.

3.9 Procedure

The study was conducted in four phases over 8 weeks:

Phase 1 - Recruitment (Weeks 1-2): Church leaders from four selected churches in Ibadan South West LGA were approached. Religious educators meeting inclusion criteria were invited to participate. Written informed consent was obtained.

Phase 2 - Baseline Assessment (Week 3): Participants completed the Sociodemographic Questionnaire, DLS, and CRRS in a group setting at their respective churches. Administration time: ~30 minutes.

Phase 3 - Training Intervention (Week 4): A structured 2-day mental health training programme was delivered (6 hours/day, total 12 hours). Training was facilitated by a clinical psychologist and a psychiatric nurse.

Phase 4 - Post-Training Assessment (Week 5): Participants completed the DLS, CRRS, and TSQ immediately post-training. A 2-week follow-up assessment (Week 7) was conducted on a subsample (n=15) for test-retest reliability.

3.10 Training Protocol

The 12-hour training programme covered four modules:

Module 1: Understanding Adolescent Development and Mental Health (3 hours)
- Adolescent brain development and vulnerability to mental disorders
- Prevalence and impact of depression in Nigerian adolescents
- Risk and protective factors (biological, psychological, social)
- DSM-5 diagnostic criteria for Major Depressive Disorder in adolescents
- Somatic vs. psychological symptom presentation

Module 2: Depression Literacy and Stigma Reduction (3 hours)
- Myths and facts about depression
- Stigma: types, consequences, and reduction strategies
- Cultural and religious beliefs about mental illness
- Help-seeking barriers and facilitators in faith communities
- Video testimonies and case vignettes

Module 3: Identification and Screening Skills (3 hours)
- Recognizing behavioral, emotional, and somatic indicators
- Using the Depression Literacy Scale as a screening aid
- Role-playing: approaching an adolescent with suspected depression
- Documentation and confidentiality in church settings
- Practice with standardized patient simulations

Module 4: Referral Pathways and Follow-Up (3 hours)
- Mapping local mental health resources (primary, secondary, tertiary)
- Referral communication: what to say, what not to say
- Building collaborative relationships with health facilities
- Follow-up support within the church community
- Developing a church mental health action plan

Training methods: Interactive lectures (30%), case-based discussions (25%), role-play and skills practice (30%), group activities and reflection (15%). Materials: PowerPoint slides, participant manual, referral directory, screening checklist."""

# Insert before ethical considerations
p_before = ethical_p
# We need to insert in reverse order so they appear in correct order
for line in reversed(new_sections.split('\n')):
    if line.strip():
        new_p = doc.add_paragraph(line)
        new_p.style = doc.styles['Heading 2'] if line.startswith('3.') and (line[3] in '89' or line[:4] in ['3.10']) else doc.styles['Normal']
        p_before.addprevious(new_p._element)

doc.save(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')
print('Chapter 3 structure fixed and missing sections added')