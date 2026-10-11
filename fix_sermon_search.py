with open(r'C:\Users\henry\Desktop\GAM APP\components\sermons\sermon-search.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the duplicate article element
old = '''                {group.items.map((sermon, index) => (
                  <article 
                    key={sermon.id} 
                    className="card space-y-2"
                    data-sermon-id={sermon.id}
tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const audioBtn = e.currentTarget.querySelector('[data-play-btn]') as HTMLButtonElement;
                        audioBtn?.click();
                      }
                    }}>
                  }>
                  <article
                    key={sermon.id} 
                    className="card space-y-2"
                    data-sermon-id={sermon.id}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const audioBtn = e.currentTarget.querySelector('[data-play-btn]') as HTMLButtonElement;
                        audioBtn?.click();
                      }
                    }}>
'''

replacement = '''                {group.items.map((sermon, index) => (
                  <article 
                    key={sermon.id} 
                    className="card space-y-2"
                    data-sermon-id={sermon.id}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const audioBtn = e.currentTarget.querySelector('[data-play-btn]') as HTMLButtonElement;
                        audioBtn?.click();
                      }
                    }}>
'''

with open(r'C:\Users\henry\Desktop\GAM APP\components\sermons\sermon-search.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(old, replacement)

with open(r'C:\Users\henry\Desktop\GAM APP\components\sermons\sermon-search.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')