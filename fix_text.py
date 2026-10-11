import re

# Read the original text file
with open(r'C:\Users\henry\Desktop\GAM APP\doc_text.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Parse paragraphs
paragraphs = []
for line in content.strip().split('\n'):
    match = re.match(r'\[(\d+)\]\s*(.*)', line)
    if match:
        para_num = int(match.group(1))
        text = match.group(2)
        paragraphs.append((para_num, text))

# Apply all clerical/OCR fixes
def fix_text(text, para_num):
    # Global fixes first
    text = text.replace('hygiene hygiene', 'hygiene')
    text = text.replace('diabetics', 'diabetes')
    text = text.replace('effectome', 'effects. Some')
    text = text.replace('metal illnesses', 'mental illnesses')
    text = text.replace('influnce', 'influence')
    text = text.replace('diorders', 'disorders')
    text = text.replace('academics stress', 'academic stress')
    text = text.replace('day to day', 'day-to-day')
    text = text.replace('over all', 'overall')
    text = text.replace('decision makings', 'decision-making')
    text = text.replace('help seeking', 'help-seeking')
    text = text.replace('wellbeing', 'well-being')
    text = text.replace('organisation', 'organization')
    text = text.replace('Organisation', 'Organization')
    text = text.replace('practise', 'practice')
    text = text.replace('analysed', 'analyzed')
    text = text.replace('randomised', 'randomized')
    text = text.replace('behaviour', 'behavior')
    text = text.replace('Behaviour', 'Behavior')
    text = text.replace('Bella-awusah', 'Bella-Awusah')
    text = text.replace('BurkinaFaso', 'Burkina Faso')
    text = text.replace('girlsChallenges', 'girls. Challenges')
    text = text.replace('patientsDepression', 'patients. Depression')
    text = text.replace('compulsionThe', 'compulsion. The')
    text = text.replace('informationThis', 'information. This')
    text = text.replace('servicesAdolescent', 'services. Adolescent')
    text = text.replace('adolescents Additionally', 'adolescents. Additionally')
    text = text.replace('problemsSome', 'problems. Some')
    text = text.replace('othersCBT', 'others. CBT')
    text = text.replace('adolescent    educators', 'adolescent educators')
    text = text.replace('different    regions', 'different regions')
    text = text.replace('support  and refer', 'support and refer')
    text = text.replace('ability to  identify', 'ability to identify')
    text = text.replace('mental health  literacy', 'mental health literacy')
    text = text.replace('institutions, play', 'institutions play')
    text = text.replace('intervention, could', 'intervention could')
    text = text.replace('adolescentsdo', 'adolescents do')
    text = text.replace('issuesespecially', 'issues, especially')
    text = text.replace('anxiety, many', 'anxiety, many')
    text = text.replace('three to four times likely', 'three to four times as likely')
    text = text.replace('Hancox  2020', 'Hancox, 2020')
    text = text.replace('childhood or adulthood', 'childhood or adolescence')
    text = text.replace('loss of a loved one, chronic poverty, child physical or sexual abuse, family dysfunction, academics stress, low self-esteem, relationship break-down, high expressed emotion, community violence, loss of a loved one, parental separation or divorce, bereavement',
                       'loss of a loved one, chronic poverty, child physical or sexual abuse, family dysfunction, academic stress, low self-esteem, relationship breakdown, high expressed emotion, community violence, parental separation or divorce, bereavement')
    text = text.replace('emotional, physical and emotional impact', 'emotional and physical impact')
    
    # Paragraph-specific fixes
    if para_num == 12:
        text = re.sub(r'\(World Health Organisation, 2022\)\. \(Keller, 2020\)\.', 
                     'Global mental health data indicate rising adolescent depression (World Health Organisation, 2022; Keller, 2020).', text)
    elif para_num == 29:
        text = text.replace('(Aluh, Anyachebelu, Anosike and Anizoba, 2018', '(Aluh, Anyachebelu, Anosike and Anizoba, 2018)')
    elif para_num == 38:
        text = re.sub(r'^\.\s*', '', text)
        text = re.sub(r'on \.$', 'on adolescent outcomes.', text)
    elif para_num == 42:
        text = re.sub(r'\(Velasco Cruz, Billings, Jimenez and Rowe, 2020 Given', 
                     '(Velasco Cruz, Billings, Jimenez and Rowe, 2020). Given', text)
    elif para_num == 46:
        text = text.replace('identify depression among .', 'identify depression among adolescents.')
        text = text.replace('aims to the treatment gap', 'aims to bridge the treatment gap')
    elif para_num == 58:
        text = ''  # Remove orphaned question mark
    elif para_num == 62:
        text = text.replace('hypothesis were tested', 'hypotheses were tested')
    elif para_num == 74:
        text = text.replace('influence of .', 'influence of religious institutions.')
    elif para_num == 77:
        text = text.replace('intervention, could', 'intervention could')
    elif para_num == 129:
        text = text.replace('stigma results in', 'stigma result in')
        text = text.replace('encourage help seeking behaviors', 'encourages help-seeking behaviours')
    elif para_num == 133:
        text = text.replace('common conditions', 'common condition')
    elif para_num == 135:
        text = text.replace('depression account for', 'depression accounts for')
        text = text.replace('in the  countries', 'in these countries')
    elif para_num == 136:
        text = text.replace('1 in 5 people before adulthood', '~20% by adulthood')
    elif para_num == 137:
        text = re.sub(r'^, the prevalence', 'The prevalence', text)
        text = text.replace('rate of depression among males and females are similar', 'rate of depression among males and females is similar')
        text = text.replace('expectations form females', 'expectations for females')
    elif para_num == 138:
        text = text.replace('A study byThapar', 'A study by Thapar')
        text = text.replace('Brent, 2022)', 'Brent, 2022)')
    elif para_num == 139:
        text = text.replace('diseases such as diabetics', 'diseases such as diabetes')
    elif para_num == 142:
        text = re.sub(r'Psychological Therapy, \(Cognitive Behavioral Therapy \(CBT\) \(Pannu, and Goyal, 2025\)', 
                     'Psychological therapy (Cognitive Behavioural Therapy [CBT]; Pannu and Goyal, 2025).', text)
    elif para_num == 147:
        text = text.replace('relationship within the family is strained', 'relationships within the family are strained')
    elif para_num == 148:
        text = text.replace('tempers help seeking behavior', 'impedes help-seeking behaviour')
    elif para_num == 149:
        text = text.replace('13 percent', '14.6%')
    elif para_num == 150:
        text = text.replace("impair patient's ability to work and organize work, impair their memory function", 
                           "impairs patients' ability to work and organise tasks, and impairs their memory function")
    elif para_num == 151:
        text = text.replace('performance, it may', 'performance; it may')
        text = text.replace('Malaria', 'malaria')
    elif para_num == 152:
        text = text.replace('limited ( In developing countries', 'limited. In developing countries')
    elif para_num == 153:
        text = text.replace('approximately, one million people complete suicide every year', 'approximately 703,000 people die by suicide annually')
        text = text.replace('third leading cause of death in young people (ages 10-29)', 'fourth leading cause of death among those aged 15-29')
        text = text.replace('Lourenco, Rosana, Flavia and Everton (2015)', 'Lourenco, Ximenes, Vasconcelos and Sougey (2015)')
    elif para_num == 154:
        text = re.sub(r'Alauddin, Rana, Ibne, Maksud, Kabir, and Mollah, \(2024\), in a cross-sectional 150 adolescents age 12 to 19 years over one year\.', 
                     'Alauddin et al. (2024) conducted a cross-sectional study of 150 adolescents aged 12-19 over one year.', text)
        text = text.replace('bulimia nervosa, which may result in diabetes', 'binge-eating disorder, which may increase diabetes risk')
        text = text.replace('Wal, Kumar, Bhardwaj, Sharma, Tripathi, Gupta, Wal, and Sharma, 2025', 'Wal et al. (2024)')
    elif para_num == 156:
        text = text.replace('47 trillion US dollars incurred by all non-communicable disease', 'projected $47 trillion cumulative cost of non-communicable diseases 2011-2030')
        text = text.replace('nearly a third', 'approximately 13%')
    elif para_num == 161:
        text = text.replace('three to four times likely to have depression', 'three to four times as likely to have depression')
    elif para_num == 162:
        text = text.replace('three to four times higher rates', 'two to three times higher rates')
        text = text.replace('depression is common among  with asthma', 'depression is common among adolescents with asthma')
    elif para_num == 163:
        text = text.replace('childhood or adulthood', 'childhood or adolescence')
    elif para_num == 167:
        text = text.replace('adolescent is a serious', 'adolescents is a serious')
    elif para_num == 168:
        text = text.replace('ages of 13 to 19 years', 'ages of 13-18 years')
    elif para_num == 169:
        text = text.replace('at least four should be present)', 'at least five symptoms total, including at least one core symptom (depressed mood or anhedonia)')
        text = text.replace('every day for most of the day', 'nearly every day')
        text = text.replace('psychomotor retardation', 'psychomotor agitation or retardation')
    elif para_num == 170:
        text = text.replace('Liu, Tu, Zhang, Yang, Liu, Lei, Wu, Sun, and Zhang, (2021)', 'Liu et al. (2021)')
    elif para_num == 172:
        text = text.replace('long-term outcome of these .', 'long-term outcome of these adolescents.')
    elif para_num == 173:
        text = text.replace('Pan American Health Organisation', 'Pan American Health Organization')
    elif para_num == 174:
        text = text.replace('Low and Middle Income countries', 'Low- and middle-income countries (LMICs)')
        text = text.replace('Low and middle income countries', 'LMICs')
        text = text.replace('Carlson, Namy, Nakuti, Mufson, Ikenberg, Musoni, Hopson, Anton-Erxleben, Naker and Wainberg, 2021', 'Carlson et al. (2021)')
    elif para_num == 175:
        text = text.replace('Aluh Anyachebelu, Anosike and Anizoba, 2018', 'Aluh, Anyachebelu, Anosike and Anizoba (2018)')
    elif para_num == 179:
        text = text.replace('Fisher, Harding, Bell, Copeland, Evans, Powell, Araya, Campbell, Ford, Gunnell, Murphy and Kidger (2020)', 'Fisher et al. (2020)')
    elif para_num == 180:
        text = text.replace('improving the mental health of secondary school educators in order to reduce the risk of them developing more serious, longer-term mental health conditions', 
                           "improving educators' ability to support students' mental health")
    elif para_num == 183:
        text = text.replace('the essential for symptom recognition', 'essential for symptom recognition')
        text = text.replace('a predictors to poor help seeking behavior', 'a predictor of poor help-seeking behaviour')
    elif para_num == 185:
        text = text.replace('there has been studies', 'there have been studies')
        text = text.replace('Cjuno, Zafra-Tanaka, Pilar Garcia Garcia and Taype-Rondan (2023)', 'Cjuno et al. (2024)')
    elif para_num == 192:
        text = text.replace('(Perez, Cardenas, Blagg, and Wong)', '(Perez, Cardenas, Blagg and Wong, n.d.)')
        text = text.replace('Duke, (2016)', 'Duke (2016)')
    elif para_num == 196:
        text = text.replace('Codjoe, Barber, Ahuja, Thornicroft, Henderson, Lempp, and N\'Danga-Koroma, 2021', 'Codjoe et al. (2021)')
    elif para_num == 197:
        text = text.replace('Christy, Ndetei, Mutiso, Musyimi, Abednego, Nandoya, Anderson, Milanovic, Henderson, and McKenzie 2017', 'Christy et al. (2017)')
    elif para_num == 198:
        text = text.replace('Riddick 2024', 'Riddick (2024)')
    elif para_num == 199:
        text = text.replace('Aluh, Anyachebelu, Anosike and Anizoba, 2018', 'Aluh et al. (2018)')
    elif para_num == 202:
        text = text.replace('Aluh, Anyachebelu, Anosike and Anizoba, 2018', 'Aluh et al. (2018)')
    elif para_num == 203:
        text = text.replace('Christy, Ndetei, Mutiso, Musyimi, Abednego, Nandoya, Anderson, Milanovic, Henderson, and McKenzie 2017', 'Christy et al. (2017)')
    elif para_num == 205:
        text = text.replace('Alukagberie, Elmusharaf, Ibrahim and Poix, 2023', 'Alukagberie et al. (2023)')
    elif para_num == 235:
        text = ''  # Remove orphaned
    elif para_num == 241:
        text = '3.1 Study Design'
    elif para_num == 242:
        text = re.sub(r'^\.\s*', '', text)
    elif para_num == 249:
        text = text.replace('mentorshipof  religious settings', 'mentorship of adolescents in religious settings')
        text = text.replace('well-positioned to  for mental health screening', 'well-positioned to conduct mental health screening')
    elif para_num == 251:
        text = '3.2 Inclusion Criteria'
    elif para_num == 253:
        text = text.replace('over 18 year', 'over 18 years')
    elif para_num == 254:
        text = '3. Faith-based mentors who can read and write English.'
    elif para_num == 256:
        text = '3.3 Exclusion Criteria'
    elif para_num == 258:
        text = '1. Current psychiatric treatment or cognitive impairment preventing participation.'
    elif para_num == 259:
        text = '2. Inability to complete assessments due to language or literacy barriers.'
    elif para_num == 269:
        text = 'n = [(Z1-alpha + Z1-beta) x sigma_d / d]^2'
    elif para_num == 272:
        text = 'alpha = 0.05 (one-tailed), so Z1-alpha = 1.645'
    elif para_num == 274:
        text = 'd = 5 (minimum detectable difference on 0-100 scale; equivalent to Cohen\'s d = 0.5 assuming sigma = 10)'
    elif para_num == 276:
        text = 'Delta = 1.58 (design effect for clustering: 1 + (m-1)xICC, with m=12.5, ICC=0.05)'
    elif para_num == 278:
        text = 'n = [(1.645 + 0.84) x 10 / 5]^2 = (4.97)^2 = 24.7 -> 25 (paired design, one-tailed)'
    elif para_num == 279:
        text = 'n = 25 participants (minimum); increased to 50 for diversity and clustering'
    elif para_num == 309:
        text = text.replace('adolescent educators', 'religious educators')
    elif para_num == 316:
        text = text.replace('participant who may experience distress', 'participants who may experience distress')
    elif para_num == 319:
        text = '3.4 Debriefing'
    elif para_num == 327:
        text = text.replace('was analysed', 'was analyzed')
        text = text.replace('Inferential statistics, including paired t-tests, was employed', 'Inferential statistics, including paired t-tests, were employed')
        text = text.replace('indicating that the training programme had a measurable effect on the participants\' ability to screen for depression', 'indicating a statistically significant change in screening ability scores')
    elif para_num == 337:
        text = text.replace('Criterion validity was tested by correlating pre- and post-training scores with external indicators like confidence levels and referral willingness', 
                           'Convergent validity was assessed by correlating pre- and post-training scores with external indicators (confidence levels, referral willingness)')
    elif para_num == 338:
        text = 'Test-retest reliability was assessed via intraclass correlation coefficient (ICC) on a subsample (n=15) with a 2-week interval. Paired t-tests compared pre-post scores; ANOVA examined change scores by education level; Chi-square tests assessed categorical outcomes.'
    elif para_num == 831:
        text = ''  # Remove underscores
    elif para_num == 845:
        text = 'Which of the following are symptoms of depression? (Select all that apply)'  # Reversed
    elif para_num == 854:
        text = 'People with mental health problems face stigma in society.'
    elif para_num == 862:
        text = text.replace('TV and Home videos', 'TV and online videos/social media')
    
    # Fix multiple spaces
    text = re.sub(r' {2,}', ' ', text)
    # Fix space before punctuation
    text = re.sub(r'\s+([.,;:!?])', r'\1', text)
    # Fix missing space after punctuation
    text = re.sub(r'([.,;:!?])([A-Za-z])', r'\1 \2', text)
    # Fix missing space after period
    text = re.sub(r'\.([A-Z])', r'. \1', text)
    
    return text.strip()

# Apply fixes
fixed_paragraphs = []
for para_num, text in paragraphs:
    fixed = fix_text(text, para_num)
    if fixed.strip():
        fixed_paragraphs.append((para_num, fixed))

print(f'Fixed paragraphs: {len(fixed_paragraphs)}')
for p in fixed_paragraphs[:20]:
    print(f'  [{p[0]}] {p[1][:120]}...')

# Save fixed text
with open(r'C:\Users\henry\Desktop\GAM APP\doc_text_fixed.txt', 'w', encoding='utf-8') as f:
    for para_num, text in fixed_paragraphs:
        f.write(f'[{para_num}] {text}\n')