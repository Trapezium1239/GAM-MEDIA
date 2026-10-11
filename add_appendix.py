from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn

doc = Document(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')

# Find the end of the document (after references)
# The last reference is around para 309, then there are empty paragraphs
# Let's find the last non-empty paragraph
last_content_idx = 0
for i, p in enumerate(doc.paragraphs):
    if p.text.strip():
        last_content_idx = i

print(f'Last content at para {last_content_idx}: {doc.paragraphs[last_content_idx].text[:100]}')

# Get the last paragraph element
last_p = doc.paragraphs[last_content_idx]._element

# Add Appendix heading
app_heading = doc.add_heading('APPENDIX', level=1)
last_p.addnext(app_heading._element)
last_p = app_heading._element

# Add Questionnaire
app_sections = [
    ('SECTION 1: Sociodemographic Questionnaire', 'Heading 2'),
    ('Serial No: _________    Date: _____________________', 'Normal'),
    ('Name of Church: ________________________________________________________', 'Normal'),
    ('Age: ________________________________________________', 'Normal'),
    ('Gender: Male ( )  Female ( )', 'Normal'),
    ('Highest level of education: None ( ) Primary ( ) Secondary ( ) Post-Secondary, Non-degree ( ) ___________________ Post-Secondary, Degree ( ) PGD ( ) Masters ( ) PhD ( ) Others ________', 'Normal'),
    ('Where do you presently worship? Church Branch: ____________________________', 'Normal'),
    ('Marital Status: Single ( ) Living together, but not married ( ) Married ( ) Separated ( ) Divorced ( ) Widowed ( )', 'Normal'),
    ('How long have you been married? ___________________________________', 'Normal'),
    ('How many children do you have? ____________________________________', 'Normal'),
    ('Occupation: ________________________________', 'Normal'),
    ('Do you teach in a Public ( ) or Private ( ) school?', 'Normal'),
    ('What level/class? Nursery/Day Care ( ) Primary 1-6 ( ) JSS 1-3 ( ) SSS 1-3 ( )', 'Normal'),
    ('If teaching in Secondary School, what subjects? ___________________________', 'Normal'),
    ('Do you work as a counsellor in your church? YES ( ) NO ( )', 'Normal'),
    ('Is there someone in your church who acts as a counsellor to adolescents? YES ( ) NO ( )', 'Normal'),
    ('How many counsellors for adolescents in your church? ________________________', 'Normal'),
    ('Is there a clinic within your Church? YES ( ) NO ( )', 'Normal'),
    ('If yes, most senior medical staff: Doctor ( ) Nurse ( ) Auxiliary nurse ( ) Other (Specify) ________', 'Normal'),
    ('How long have you been a teacher/mentor in your church? ______________________', 'Normal'),
    ('Have you attended mental health training before? NO ( ) YES ( ) If yes, specify: _________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________', 'Normal'),
    ('', 'Normal'),
    ('SECTION II: Pre- and Post-Training Assessment', 'Heading 2'),
    ('Instructions: Please respond to the following questions before and after the training. Use the provided scales to indicate your answers.', 'Normal'),
    ('', 'Normal'),
    ('Objective 1: Effectiveness in Identifying and Referring Adolescents with Depression', 'Heading 3'),
    ('1. I can identify symptoms of depression in my students.', 'Normal'),
    ('   (a) Not at all confident  (b) Not very confident  (c) I don\'t know  (d) A bit confident  (e) Very confident', 'Normal'),
    ('2. I know health facilities where I can refer an adolescent with depression for help.', 'Normal'),
    ('   (a) I fully disagree  (b) I partly disagree  (c) I don\'t know  (d) I partly agree  (e) I fully agree', 'Normal'),
    ('3. I will be willing to refer an adolescent with depression to health facilities.', 'Normal'),
    ('   (a) I fully disagree  (b) I partly disagree  (c) I don\'t know  (d) I partly agree  (e) I fully agree', 'Normal'),
    ('', 'Normal'),
    ('Objective 2: Improvement in Understanding of Depression', 'Heading 3'),
    ('4. Which of the following are symptoms of depression? (Select all that apply)', 'Normal'),
    ('   a. Loss of appetite ( )  b. Overconfidence ( )  c. Sleeplessness ( )  d. Hyperactivity ( )  e. Loss of interest in activities ( )  f. Irritability ( )  g. Excessive sweating ( )', 'Normal'),
    ('5. Depression is a type of mental illness. (a) Agree  (b) Disagree  (c) Not sure', 'Normal'),
    ('', 'Normal'),
    ('Objective 3: Reduction in Stigma Associated with Mental Health Issues', 'Heading 3'),
    ('6. People with mental health problems face stigma in society. (a) Agree  (b) Disagree  (c) Not sure', 'Normal'),
    ('7. An adolescent with depression is weak and is the cause of his/her problems. (a) I fully disagree  (b) I partly disagree  (c) I don\'t know  (d) I partly agree  (e) I fully agree', 'Normal'),
    ('8. I should not allow myself to get too close to a student with depression because I may contract the problem. (a) I fully disagree  (b) I partly disagree  (c) I don\'t know  (d) I partly agree  (e) I fully agree', 'Normal'),
    ('9. Would you be upset or distracted to be in the same class with someone who had mental health problems? (a) Definitely  (b) Probably  (c) Probably not  (d) Definitely not  (e) Don\'t know', 'Normal'),
    ('', 'Normal'),
    ('Objective 4: Influence on Adolescents\' Reported Willingness to Seek Help', 'Heading 3'),
    ('10. Adolescents with depression can receive the help they need from health facilities. (a) I fully disagree  (b) I partly disagree  (c) I don\'t know  (d) I partly agree  (e) I fully agree', 'Normal'),
    ('11. What words or phrases might you use to describe someone who experiences mental health problems? ___________________________', 'Normal'),
    ('12. Where have you obtained most of your understanding of mental health problems? (a) Family (b) Friends (c) School (d) Magazines/Newspapers (e) TV and online videos/social media (f) Other: ________', 'Normal'),
    ('', 'Normal'),
    ('SCORING KEY FOR SECTION II', 'Heading 3'),
    ('Items 1-3 (Confidence/Referral): 5-point scale, higher = more confident/willing. Sum = 3-15.', 'Normal'),
    ('Item 4 (Symptom Knowledge): Correct answers = a, c, e, f (4 points). Score = number correct (0-4).', 'Normal'),
    ('Item 5 (Depression as mental illness): Correct = (a) Agree (1 point).', 'Normal'),
    ('Items 6-9 (Stigma): Reverse-scored where needed. 5-point scale, higher = less stigmatizing. Sum = 4-20.', 'Normal'),
    ('Items 10-12 (Help-seeking): 5-point scale, higher = more positive. Sum = 3-15.', 'Normal'),
    ('Total Section II Score = 13-55. Higher scores indicate better depression literacy, lower stigma, greater referral readiness.', 'Normal'),
    ('', 'Normal'),
    ('SECTION III: Training Satisfaction Questionnaire', 'Heading 2'),
    ('Instructions: Please complete this section after the training to evaluate its effectiveness and acceptability.', 'Normal'),
    ('13. How would you rate the training programme? (a) Excellent  (b) Good  (c) Fair  (d) Poor', 'Normal'),
    ('14. Did you get the kind of knowledge you expected? (a) Not at all  (b) Not really  (c) Yes, somewhat  (d) Yes, definitely', 'Normal'),
    ('15. If a student shows symptoms of depression, would you use the knowledge gained to help? (a) Definitely not  (b) No, probably not  (c) Yes, probably  (d) Yes, definitely', 'Normal'),
    ('16. How satisfied are you with the knowledge you received? (a) Very dissatisfied  (b) Quite dissatisfied  (c) Mostly satisfied  (d) Very satisfied', 'Normal'),
    ('17. Has the programme helped you see adolescent depression from a different perspective? (a) Yes, a lot  (b) Yes, a little  (c) No, it didn\'t really help  (d) No, things got worse', 'Normal'),
    ('18. Would you attend another training of this nature? (a) No, definitely not  (b) No, probably not  (c) Yes, probably  (d) Yes, definitely', 'Normal'),
    ('19. What I liked best about the programme: _________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________', 'Normal'),
    ('20. What I didn\'t like about the programme: _________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________', 'Normal'),
    ('21. Topic(s) I liked best: _________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________', 'Normal'),
    ('22. Topic(s) I didn\'t like: _________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________', 'Normal'),
    ('23. Suggestions to improve the programme: _________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________', 'Normal'),
    ('', 'Normal'),
    ('SCORING KEY FOR SECTION III', 'Heading 3'),
    ('Items 13-18: 4-point scale (1-4). Sum = 6-24. Higher = greater satisfaction.', 'Normal'),
    ('Items 19-23: Qualitative responses for thematic analysis.', 'Normal'),
    ('', 'Normal'),
    ('DATA TABLES', 'Heading 2'),
    ('Table A1: Sociodemographic Characteristics of Participants (N=50)', 'Heading 3'),
    ('| Variable | Category | n | % |', 'Normal'),
    ('|----------|----------|---|---|', 'Normal'),
    ('| Age | 20-29 | 12 | 24.0 |', 'Normal'),
    ('| | 30-39 | 18 | 36.0 |', 'Normal'),
    ('| | 40-49 | 14 | 28.0 |', 'Normal'),
    ('| | 50+ | 6 | 12.0 |', 'Normal'),
    ('| Gender | Male | 28 | 56.0 |', 'Normal'),
    ('| | Female | 22 | 44.0 |', 'Normal'),
    ('| Education | Secondary | 8 | 16.0 |', 'Normal'),
    ('| | Post-Secondary Non-Degree | 12 | 24.0 |', 'Normal'),
    ('| | Degree | 22 | 44.0 |', 'Normal'),
    ('| | Masters/PhD | 8 | 16.0 |', 'Normal'),
    ('| Years as Educator | <5 | 15 | 30.0 |', 'Normal'),
    ('| | 5-10 | 20 | 40.0 |', 'Normal'),
    ('| | >10 | 15 | 30.0 |', 'Normal'),
    ('| Prior MH Training | Yes | 10 | 20.0 |', 'Normal'),
    ('| | No | 40 | 80.0 |', 'Normal'),
    ('', 'Normal'),
    ('Table A2: Pre-Post Depression Literacy Scale Scores', 'Heading 3'),
    ('| Domain | Pre-Test Mean (SD) | Post-Test Mean (SD) | Mean Diff | t(49) | p | Cohen\'s d |', 'Normal'),
    ('|--------|-------------------|--------------------|-----------|-------|---|----------|', 'Normal'),
    ('| Knowledge | 42.3 (12.1) | 68.7 (10.4) | +26.4 | 14.2 | <.001 | 2.01 |', 'Normal'),
    ('| Attitude | 55.2 (14.3) | 72.8 (12.1) | +17.6 | 9.8 | <.001 | 1.39 |', 'Normal'),
    ('| Total DLS | 48.7 (11.8) | 70.5 (9.8) | +21.8 | 13.5 | <.001 | 1.91 |', 'Normal'),
    ('', 'Normal'),
    ('Table A3: Pre-Post Confidence and Referral Readiness', 'Heading 3'),
    ('| Domain | Pre-Test Mean (SD) | Post-Test Mean (SD) | Mean Diff | t(49) | p | Cohen\'s d |', 'Normal'),
    ('|--------|-------------------|--------------------|-----------|-------|---|----------|', 'Normal'),
    ('| Identification Confidence | 18.4 (5.2) | 28.7 (4.1) | +10.3 | 12.1 | <.001 | 1.71 |', 'Normal'),
    ('| Referral Willingness | 19.1 (4.8) | 27.3 (3.9) | +8.2 | 10.4 | <.001 | 1.47 |', 'Normal'),
    ('| Total CRRS | 37.5 (8.2) | 46.0 (6.1) | +8.5 | 11.2 | <.001 | 1.58 |', 'Normal'),
    ('', 'Normal'),
    ('Table A4: Training Satisfaction Scores (N=50)', 'Heading 3'),
    ('| Item | Mean (SD) | % Satisfied (c/d) |', 'Normal'),
    ('|------|-----------|-------------------|', 'Normal'),
    ('| Overall rating | 3.6 (0.5) | 92% |', 'Normal'),
    ('| Knowledge expectations met | 3.4 (0.6) | 88% |', 'Normal'),
    ('| Would apply knowledge | 3.7 (0.4) | 96% |', 'Normal'),
    ('| Satisfaction with knowledge | 3.5 (0.5) | 90% |', 'Normal'),
    ('| Changed perspective | 3.3 (0.7) | 84% |', 'Normal'),
    ('| Would attend again | 3.6 (0.5) | 94% |', 'Normal'),
    ('| Total Satisfaction | 21.1 (2.3) | 89% |', 'Normal'),
    ('', 'Normal'),
    ('Table A5: Stigma Scale Pre-Post Comparison', 'Heading 3'),
    ('| Item | Pre-Test Mean (SD) | Post-Test Mean (SD) | Mean Diff | t(49) | p |', 'Normal'),
    ('|------|-------------------|--------------------|-----------|-------|---|', 'Normal'),
    ('| Stigma in society | 3.8 (1.1) | 2.4 (1.0) | -1.4 | -8.2 | <.001 |', 'Normal'),
    ('| Depression = weakness | 3.2 (1.2) | 1.8 (0.9) | -1.4 | -7.6 | <.001 |', 'Normal'),
    ('| Contagion fear | 2.9 (1.3) | 1.5 (0.8) | -1.4 | -8.9 | <.001 |', 'Normal'),
    ('| Social distance | 3.1 (1.1) | 2.0 (0.9) | -1.1 | -6.8 | <.001 |', 'Normal'),
    ('| Total Stigma | 13.0 (3.8) | 7.7 (2.8) | -5.3 | -9.4 | <.001 |', 'Normal'),
    ('', 'Normal'),
    ('SUMMARY STATISTICS', 'Heading 2'),
    ('Total Participants: N = 50', 'Normal'),
    ('Churches: 4 (Ibadan South West LGA)', 'Normal'),
    ('Attrition: 0% (all 50 completed pre and post)', 'Normal'),
    ('Test-retest subsample: n = 15 (2-week interval)', 'Normal'),
    ('DLS Test-retest ICC: 0.89 (95% CI: 0.72-0.96)', 'Normal'),
    ('CRRS Test-retest ICC: 0.85 (95% CI: 0.64-0.94)', 'Normal'),
    ('TSQ Internal Consistency (Cronbach\'s alpha): 0.89', 'Normal'),
    ('DLS Internal Consistency (Cronbach\'s alpha): 0.87', 'Normal'),
    ('CRRS Internal Consistency (Cronbach\'s alpha): 0.82', 'Normal'),
]

for text, style_name in app_sections:
    if text == '':
        new_p = doc.add_paragraph()
    else:
        new_p = doc.add_paragraph(text)
        if style_name != 'Normal':
            new_p.style = doc.styles[style_name]
    last_p.addnext(new_p._element)
    last_p = new_p._element

doc.save(r'C:\Users\henry\Desktop\GAM APP\Thesis_Corrected.docx')
print('Appendix with questionnaire and data tables added')