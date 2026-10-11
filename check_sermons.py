import json
with open('scripts/parsed-sermons.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
print(f'Total sermons: {len(data)}')
with_audio = sum(1 for s in data if s['audio_url'])
print(f'With audio: {with_audio}')
for i, s in enumerate(data[:10]):
    print(f'{i+1}. {s["title"][:60]} | {s["preacher"]} | {s["date"]} | audio={bool(s["audio_url"])} | topic={s.get("topic_id", "none")}')