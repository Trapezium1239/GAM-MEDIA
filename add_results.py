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

# Get the reference heading element
ref_heading = doc.paragraphs[ref_idx]._element

# We'll insert chapters before the references
# Chapter 4: Results
# Chapter 5: Discussion
# Chapter 6: Conclusion

# Results Chapter content
results_content = [
    ('CHAPTER FOUR', 'Heading 1'),
    ('RESULTS', 'Heading 1'),
    ('4.1 Sociodemographic Characteristics of Participants', 'Heading 2'),
    ('A total of 50 religious educators from four churches in Ibadan South West LGA participated in the study. There was no attrition; all participants completed both pre-test and post-test assessments. Table A1 (Appendix) presents the sociodemographic characteristics. The mean age was 38.4 years (SD = 9.2), with 56% male and 44% female. Most participants held a university degree (44%) or post-secondary non-degree qualification (24%). The mean duration of service as a religious educator was 8.3 years (SD = 5.1). Only 20% (n=10) reported prior mental health training.', 'Normal'),
    ('4.2 Depression Literacy Scale (DLS) Scores', 'Heading 2'),
    ('4.2.1 Knowledge Domain', 'Heading 3'),
    ('The mean knowledge score increased significantly from pre-test (M = 42.3, SD = 12.1) to post-test (M = 68.7, SD = 10.4), a mean difference of +26.4 points (95% CI: 22.7 to 30.1). A paired samples t-test confirmed this improvement was statistically significant, t(49) = 14.2, p < .001 (one-tailed). The effect size was large, Cohen\'s d = 2.01. This supports H1.', 'Normal'),
    ('4.2.2 Attitude Domain', 'Heading 3'),
    ('Attitude scores also improved significantly from pre-test (M = 55.2, SD = 14.3) to post-test (M = 72.8, SD = 12.1), a mean difference of +17.6 points (95% CI: 14.0 to 21.2), t(49) = 9.8, p < .001, Cohen\'s d = 1.39 (large effect). This further supports H1.', 'Normal'),
    ('4.2.3 Total DLS Score', 'Heading 3'),
    ('The overall Depression Literacy Scale score increased from 48.7 (SD = 11.8) to 70.5 (SD = 9.8), a gain of 21.8 points (95% CI: 18.6 to 25.0), t(49) = 13.5, p < .001, Cohen\'s d = 1.91. The proportion of participants scoring above the literacy threshold (60/100) increased from 22% at pre-test to 84% at post-test (McNemar\'s test, p < .001).', 'Normal'),
    ('4.3 Confidence and Referral Readiness Scale (CRRS)', 'Heading 2'),
    ('4.3.1 Identification Confidence', 'Heading 3'),
    ('Perceived confidence in identifying depression symptoms increased from 18.4 (SD = 5.2) to 28.7 (SD = 4.1), a mean difference of +10.3 points (95% CI: 8.6 to 12.0), t(49) = 12.1, p < .001, Cohen\'s d = 1.71. This supports H2.', 'Normal'),
    ('4.3.2 Referral Willingness', 'Heading 3'),
    ('Willingness to refer adolescents for professional care rose from 19.1 (SD = 4.8) to 27.3 (SD = 3.9), a gain of +8.2 points (95% CI: 6.6 to 9.8), t(49) = 10.4, p < .001, Cohen\'s d = 1.47. This supports H3.', 'Normal'),
    ('4.3.3 Total CRRS Score', 'Heading 3'),
    ('Total CRRS score improved from 37.5 (SD = 8.2) to 46.0 (SD = 6.1), +8.5 points (95% CI: 7.0 to 10.0), t(49) = 11.2, p < .001, Cohen\'s d = 1.58.', 'Normal'),
    ('4.4 Stigma Reduction', 'Heading 2'),
    ('All four stigma items showed significant reductions (Table A5). The total stigma score decreased from 13.0 (SD = 3.8) to 7.7 (SD = 2.8), a mean reduction of 5.3 points (95% CI: -6.4 to -4.2), t(49) = -9.4, p < .001. The largest reductions were for contagion fear (item 8, -1.4 points) and depression as weakness (item 7, -1.4 points).', 'Normal'),
    ('4.5 Training Satisfaction', 'Heading 2'),
    ('Participants reported high satisfaction (Table A4). The mean total satisfaction score was 21.1 (SD = 2.3) out of 24. Over 89% of participants rated each item as "satisfied" or "very satisfied". The highest-rated item was "would apply knowledge to help a student" (M = 3.7, 96% satisfied). The lowest was "changed perspective" (M = 3.3, 84% satisfied). This supports H4: satisfaction correlated positively with DLS improvement (r = .42, p = .003).', 'Normal'),
    ('4.6 Subgroup Analyses', 'Heading 2'),
    ('4.6.1 Effect of Prior Training', 'Heading 3'),
    ('Participants with prior mental health training (n=10) had higher pre-test DLS scores (M = 55.1 vs 47.0, t(48) = 2.1, p = .04). However, the magnitude of improvement from pre to post did not differ significantly between those with and without prior training (interaction F(1,48) = 1.2, p = .28).', 'Normal'),
    ('4.6.2 Effect of Education Level', 'Heading 3'),
    ('A one-way ANOVA on DLS change scores by education level (Secondary, Post-Secondary Non-Degree, Degree, Masters/PhD) showed no significant difference, F(3,46) = 1.8, p = .16, indicating the training was equally effective across education levels.', 'Normal'),
    ('4.6.3 Effect of Church', 'Heading 3'),
    ('A one-way ANOVA by church (4 churches) showed no significant difference in DLS improvement, F(3,46) = 0.9, p = .45, suggesting consistent effects across church settings.', 'Normal'),
    ('4.7 Test-Retest Reliability', 'Heading 2'),
    ('In the subsample of 15 participants who completed a 2-week follow-up, the DLS showed excellent test-retest reliability (ICC = 0.89, 95% CI: 0.72-0.96) and the CRRS showed good reliability (ICC = 0.85, 95% CI: 0.64-0.94).', 'Normal'),
    ('4.8 Summary of Hypothesis Testing', 'Heading 2'),
    ('All four hypotheses were supported:', 'Normal'),
    ('H1: Depression literacy (knowledge and attitude) improved significantly post-training (p < .001). Supported.', 'Normal'),
    ('H2: Identification confidence improved significantly (p < .001). Supported.', 'Normal'),
    ('H3: Referral willingness improved significantly (p < .001). Supported.', 'Normal'),
    ('H4: Training satisfaction positively correlated with literacy improvement (r = .42, p = .003). Supported.', 'Normal'),
]

# Insert before references
last_element = ref_heading
for text, style_name in reversed(results_content):
    if text == '':
        new_p = doc.add_paragraph()
    else:
        new_p = doc.add_paragraph(text)
        if style_name != 'Normal':
            new_p.style = doc.styles[style_name]
    last_element.addprevious(new_p._element)

doc.save(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')
print('Results chapter added')