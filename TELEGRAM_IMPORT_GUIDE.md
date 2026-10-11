# Telegram Sermon Import Guide

## Quick Start

### 1. Export from Telegram
1. Open **Telegram Desktop** (not mobile)
2. Right-click the channel/group → **Export chat history**
3. Format: **JSON** ✓ (not HTML)
4. Save as `telegram-export.json`

### 2. Parse the Export
```bash
# Place export in scripts/
cp ~/Downloads/telegram-export.json scripts/

# Run parser
npx tsx scripts/parse-telegram-sermons.ts scripts/telegram-export.json
```

### 3. Review Output
- Check `scripts/parsed-sermons.json`
- Verify titles, dates, preachers, topics
- Edit manually if needed

### 4. Import via Admin
1. Go to **Admin → Sermons → Bulk Import**
2. Upload `parsed-sermons.json`
3. Review/select sermons
4. Click **Import**

---

## Telegram Export Format Support

The parser handles:
- **Text messages** with structured content
- **Captioned audio/video** files
- **Date extraction** from multiple formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- **Auto-topic assignment** based on keywords
- **URL detection** for YouTube/video links

### Expected Message Formats

**Format 1 (Recommended):**
```
**Sermon Title**
Preacher Name - 15/01/2024

Sermon body text with scripture references...
```

**Format 2:**
```
Sermon Title
Preacher Name
15/01/2024

Sermon body...
```

**Format 3 (with media):**
```
[Audio file attached]
Caption: "Sunday Service - Pastor John - 15/01/2024"
```

---

## Topic Auto-Assignment

Keywords → Topic IDs:
- `faith` → `faith`
- `prayer` → `prayer`
- `healing` → `healing`
- `deliverance` → `deliverance`
- `holy spirit` → `holy-spirit`
- `salvation` → `salvation`
- `grace` → `grace`
- `worship` → `worship`
- `tithe/offering` → `giving`
- `mission/evangelism` → `missions`
- `family/marriage` → `family`
- `youth/children` → `youth`
- `leadership/discipleship` → `leadership`
- `end times/prophecy` → `end-times`
- `revival` → `revival`

---

## Audio File Handling

### Option 1: Telegram Audio in Export
If audio files are exported with messages:
1. Files saved locally in export folder
2. Upload manually via Admin → Audio Upload
3. Copy URL → Add to sermon's `audio_url`

### Option 2: External Links
- YouTube links auto-detected → `video_link`
- Direct MP3/MP4 URLs → `audio_url`

### Option 3: Bulk Audio Upload (Future)
- Admin → Audio Upload supports multiple files
- Auto-match by filename/date

---

## Duplicate Prevention

Bulk import uses **skipDuplicates: true** by default:
- Matches on **title + date** combination
- Existing sermons are skipped
- Report shows: inserted / skipped counts

---

## Troubleshooting

**"Invalid date format"**
- Parser tries DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
- Manually fix date in parsed-sermons.json if needed

**"No valid sermons"**
- Check export has `messages` array
- Messages must have `text` or `caption`
- Service messages (joins, pins) are ignored

**Topic not assigned**
- Add keywords to `TOPIC_KEYWORDS` in parser
- Or manually edit `topic_id` in JSON before import

**Audio not found**
- Telegram export saves audio separately
- Files in `export_folder/files/`
- Upload via Admin → Audio Upload → copy URL

---

## Large Imports (500+ sermons)

- Max 500 per batch (API limit)
- Split into multiple JSON files if needed
- Run parser with `--limit` flag (add to script)
- Import in chronological order for better UX

---

## Next Steps After Import

1. **Verify on site** → `/sermons` page
2. **Add missing audio** → Admin → Audio Upload
3. **Fix topics** → Admin → Topics management
4. **Set featured** → Home page picks latest 3
5. **Test playback** → Persistent player at bottom