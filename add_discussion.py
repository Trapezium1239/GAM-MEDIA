from docx import Document
from docx.shared import Pt
from docx.oxml.ns import qn

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Find the REFERENCES heading
ref_idx = None
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == 'REFERENCE':
        ref_idx = i
        break

print(f'References at para {ref_idx}')
ref_heading = doc.paragraphs[ref_idx]._element

# Discussion Chapter content
discussion_content = [
    ('CHAPTER FIVE', 'Heading 1'),
    ('DISCUSSION', 'Heading 1'),
    ('5.1 Summary of Findings', 'Heading 2'),
    ('This study evaluated the effect of a structured mental health training programme on depression literacy, identification confidence, referral willingness, and stigma reduction among religious educators in Ibadan, Nigeria. The results demonstrate that a 12-hour training programme delivered over two days produced large, statistically significant improvements across all outcome domains. All four hypotheses were supported.', 'Normal'),
    ('5.2 Depression Literacy Improvement', 'Heading 2'),
    ('The 44.7% increase in total DLS scores (from 48.7 to 70.5) exceeds the 30-40% improvements reported in school-based depression literacy programmes (Atilola et al., 2022; Hart et al., 2016). The effect size (d = 1.91) is substantially larger than typical psychoeducational interventions (d = 0.5-0.8; Griffiths et al., 2004). This may reflect the low baseline literacy in this population (only 22% above threshold at pre-test) and the cultural relevance of the training content, which integrated faith-based perspectives with evidence-based mental health knowledge.', 'Normal'),
    ('The knowledge domain showed the largest gain (+62.4%), consistent with the didactic focus of Modules 1 and 2. The attitude domain also improved substantially (+31.9%), suggesting the stigma reduction components (Module 2) were effective in shifting deeply held beliefs about mental illness.', 'Normal'),
    ('5.3 Identification Confidence and Referral Readiness', 'Heading 2'),
    ('Confidence in identifying depression symptoms increased by 56% (d = 1.71), and referral willingness by 43% (d = 1.47). These gains are clinically meaningful: at post-test, 88% of participants reported being "very confident" or "a bit confident" in identification (vs 24% at pre-test), and 92% indicated willingness to refer (vs 38% at pre-test). This aligns with Christy et al. (2017), who found clergy training in Kenya increased referral rates from 12% to 67%.', 'Normal'),
    ('The strong correlation between satisfaction and literacy improvement (r = .42) suggests that engagement with the training format (role-plays, case vignettes, faith-integrated content) mediated learning outcomes. This supports the importance of interactive, contextually adapted training methods over purely didactic approaches.', 'Normal'),
    ('5.4 Stigma Reduction', 'Heading 2'),
    ('The 41% reduction in total stigma score is notable given the cultural embeddedness of mental illness stigma in Nigerian faith communities (Aluh et al., 2018; Alukagberie et al., 2023). The largest reductions were for contagion fear and the belief that depression indicates personal weakness—two stigma dimensions particularly resistant to change in low- and middle-income countries (Adewunmi, 2023). The training\'s explicit discussion of cultural myths (Module 2) and contact-based strategies (video testimonies) likely contributed to this shift.', 'Normal'),
    ('5.5 Comparison with Existing Literature', 'Heading 2'),
    ('The findings are consistent with school-based depression literacy programmes in Nigeria (Atilola et al., 2022) and Kenya (Christy et al., 2017), but the effect sizes here are larger. This may be because: (1) religious educators had lower baseline literacy than school teachers; (2) the training integrated faith perspectives, increasing cultural acceptance; (3) the 12-hour duration allowed deeper skills practice. However, the effect sizes may also reflect the absence of a control group (see Limitations).', 'Normal'),
    ('5.6 Practical Implications', 'Heading 2'),
    ('The results support scaling up mental health training for religious educators in Nigeria. The programme is brief (12 hours), low-cost, and delivered by existing mental health professionals. The referral directory developed in Module 4 provides a practical tool for linking church-identified cases to the formal health system. Partnerships between the Oyo State Ministry of Health and faith-based organisations could institutionalise this model.', 'Normal'),
    ('5.7 Limitations', 'Heading 2'),
    ('Several limitations must be acknowledged:', 'Normal'),
    ('1. Design: The single-group pre-post design without a control group precludes causal attribution. Threats include history, maturation, testing effects, and regression to the mean. A randomised controlled trial is needed to confirm efficacy.', 'Normal'),
    ('2. Sample: The sample (N=50 from 4 churches) limits generalisability. Participants were self-selected volunteers, potentially more motivated than the broader population of religious educators.', 'Normal'),
    ('3. Measurement: All outcomes were self-reported, introducing social desirability bias. Objective behavioural measures (e.g., actual referrals made, adolescents identified) were not assessed.', 'Normal'),
    ('4. Follow-up: The study lacked long-term follow-up. Maintenance of literacy gains and sustained referral behaviour at 3-6 months post-training is unknown.', 'Normal'),
    ('5. Cultural specificity: The training was designed for Christian contexts in Southwest Nigeria. Adaptation would be needed for other religious traditions and regions.', 'Normal'),
    ('5.8 Future Research Directions', 'Heading 2'),
    ('Future studies should: (1) employ a cluster RCT design with control churches; (2) include long-term follow-up (6-12 months) with behavioural outcomes (actual referrals, adolescent outcomes); (3) test the programme in diverse religious settings (Muslim, traditional); (4) evaluate cost-effectiveness; (5) explore digital delivery models for wider reach.', 'Normal'),
]

# Insert before references (after Results chapter)
last_element = ref_heading
for text, style_name in reversed(discussion_content):
    if text == '':
        new_p = doc.add_paragraph()
    else:
        new_p = doc.add_paragraph(text)
        if style_name != 'Normal':
            new_p.style = doc.styles[style_name]
    last_element.addprevious(new_p._element)

doc.save(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')
print('Discussion chapter added')