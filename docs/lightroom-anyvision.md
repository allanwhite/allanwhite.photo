# Any Vision (Lightroom Plugin) — Technical Notes

**Source:** https://johnrellis.com/lightroom/anyvision.htm (John R. Ellis Lightroom Plugins)
**Page last modified:** 2026-06-19 (per page metadata) — content reflects plugin version **1.37** (2026-06-18)
**Notes captured:** 2026-06-30

## 1. Overview

Any Vision is a Lightroom Classic plugin that uses Google's AI services to describe, tag, classify, and search photos and videos. Per the page's own description: "Use Google's state-of-the art AI to describe, tag, classify, and search your photos and videos."

It has two main commands:

- **Prompt** — lets the user write free-text prompts, sent to **Google Gemini**, that describe or classify photos/videos; results are stored via configurable "actions" into metadata fields and/or keywords.
- **Classify** — formerly called **Analyze**; uses **Google Cloud Vision** to tag photos with objects, activities, landmarks, logos, facial expressions, dominant colors, and OCR text, using a fixed (non-prompted) feature set.

Both commands write results into Lightroom's keyword hierarchy and metadata fields, support translation to/from 100+ languages, support searching those fields/keywords within Lightroom, and support exporting results to CSV.

## 2. Key Features and Capabilities

**Prompt command:**
- Generate captions, headlines, and accessibility fields: Alt Text and Extended Description
- Generate keywords/descriptions tuned for specific use cases (e.g., stock photo agencies)
- Create custom descriptions/classifications (e.g., room type and design style for real estate photos, clothing worn by riders in motorcycle photos)
- Extract numbers from athletes' bibs/jerseys, motorcycles, and cars into fields or keywords
- Extract embedded text (OCR)
- Generate audio transcripts of videos
- Over a dozen built-in prompts, editable or deletable, restorable via "Add Built-in"
- Supports JSON-schema-constrained structured output
- Supports inserting photo metadata into prompt text via "tokens" (e.g., `{Country/Region}`, `{Child Keywords, People}`)
- Advanced Lua-code transform action for programmatic post-processing of Gemini's text response

**Classify command:**
- Tags photos with: objects, activities, landmarks, logos, facial expressions, and dominant colors
- Extracts embedded text (OCR)
- Finds visually/color-similar photos ("Find with Similar Labels", "Sort by Color")

**Shared capabilities (both commands):**
- Store tags/text in Lightroom keywords and metadata fields
- Recognize and translate 100+ languages
- Search tags/fields to locate photos
- Export results to comma-separated (CSV) text files

## 3. Requirements

- **Lightroom version:** requires Lightroom 6.14 (CC 2015) or Lightroom Classic. Does **not** work with the cloud-based (non-Classic) Lightroom, which doesn't support plugins.
- **OS:** Windows and Mac OS.
- **API/service dependencies:**
  - **Google Gemini API** (via Google AI Studio / `aistudio.google.com`) — powers **Prompt**.
  - **Google Cloud Vision API** — powers **Classify**.
  - **Google Cloud Translation API** — powers translation features for both commands.
  - As of **version 1.32 (2026-04-26)**: Google now requires separate API keys for **Prompt** (Gemini) and **Classify** (Cloud Vision). Existing keys used for both continue to work, but new keys can only be used for one command.
  - As of **June 19, 2026**: Gemini requires API keys be "secured," tied to specific Google Cloud services. Keys obtained before end of April 2026 are "unsecured" and will start failing; fix is to get new keys.
- **Billing account:** optional for **Prompt** (works free but slow/rate-limited without one); **required** for **Classify** and for faster/unmetered **Prompt** use.
- **Licensing/pricing model:**
  - Free trial: intro CTA says 50 photos; the Download/Install section and v1.18 changelog say 200 photos (page is internally inconsistent — both figures preserved here).
  - Paid license: **$14.95**, "pay a price you name," purchased via e-junkie: `https://www.e-junkie.com/ecom/gb.php?&c=cart&ejc=2&cl=133241&i=1529347`. Includes unlimited upgrades.
  - Google-side usage costs are separate and pay-as-you-go.

## 4. Installation / Setup

1. Download `anyvision.1.37.zip` from `https://johnrellis.com/lightroom/anyvision.1.37.zip`.
2. **Upgrading:** exit Lightroom, delete the existing `anyvision.lrplugin` folder, replace with the new one from the zip, restart Lightroom.
3. **New install:** extract the `anyvision.lrplugin` folder from the zip and move it anywhere.
4. In Lightroom: **File > Plug-in Manager**.
5. Click **Add**, browse to and select the `anyvision.lrplugin` folder, then **Select Folder** (Windows) or **Add Plug-in** (Mac).
6. Get a Google API key for **Prompt** (usable free, though slow, indefinitely).
7. Optionally set up a Google billing account for faster **Prompt** performance.
8. To use **Classify**, set up billing and get a separate API key for **Classify**.

### Getting Google API keys and billing

**Prompt API key:**
1. Sign in at google.com.
2. Go to `https://aistudio.google.com/app/api-keys`, agree to terms.
3. A project + Gemini API key is auto-created (click **Create API Key** if not shown).
4. Click **Copy API key**.
5. In Lightroom: **File > Plug-in Extras > Prompt**, click **Google Key**, paste key.

**Billing account setup:**
1. Go to `https://aistudio.google.com/app/api-keys`.
2. Click **Set up billing**.
3. Enter name, add payment method.
4. Prepay minimum ($10 US), set auto-reload minimum ($1 US).

**Classify API key:**
1. Enable Cloud Vision API: `https://console.developers.google.com/apis/api/vision.googleapis.com/overview`.
2. Enable Cloud Translation API: `https://console.cloud.google.com/apis/api/translate.googleapis.com`.
3. Go to Credentials (`https://console.cloud.google.com/apis/credentials`), **Create credentials > API key**.
4. Rename key to "Cloud Vision," restrict to **Cloud Translation API** and **Cloud Vision API**, click **Create**.
5. Copy the new key.
6. In Lightroom: **File > Plug-in Extras > Classify**, click **Google Key**, paste key.

### Buying a license
1. Purchase at the e-junkie URL above ($14.95).
2. Copy license key from confirmation page/email.
3. **Library > Plug-in Extras > Any Vision > Classify**.
4. Click **Buy**.
5. Paste key into **License key** box, click **OK**.

## 5. How It Works — Metadata, Fields, and AI Services

### AI services integrated
- **Google Gemini** (`https://gemini.google.com/faq`) — for **Prompt**.
- **Google Cloud Vision** (`https://cloud.google.com/vision/`) — for **Classify** (the AI tech underlying Google image search).
- **Google Cloud Translation** (`https://cloud.google.com/translate/`) — same tech behind Google Translate; used for translating labels/features/prompt results into 100+ languages.

### Metadata fields
- **Copy to field** action (Prompt) can write to any of **49 standard metadata fields** plus **10 custom fields named "Prompt 1" through "Prompt 10"** (viewable via the **Any Vision > Prompt** custom Metadata panel tagset).
- **Classify** results are viewable in the **Any Vision > Classify** metadata tagset, and include per-item confidence scores, e.g. "mountain (85)" for labels/landmarks/logos (scored 0–100, though Cloud Vision practically returns only scores ≥50), and bucketed scores ("very unlikely" to "very likely") for Faces and Safety.
- **Classify** feature categories and their Cloud Vision cost tier (each $1.50/1000 photos except Safety, free if Labels also selected):
  - **Labels** — objects, activities, qualities (e.g., "mountain," "tabby cat," "road cycling")
  - **Landmarks** — specific locations, each with a GPS lat/long; can auto-populate the photo's GPS field
  - **Logos** — product/service logos
  - **Faces** — facial "sentiment"/expression (Joy, Sorrow, Anger, Surprise), plus Under Exposed / Blurred / Headwear tags
  - **Safety** — Adult, Spoof, Medical, Violence flags (free if Labels also chosen)
  - **Text** — OCR-recognized text
  - **Dominant Color** — ten most dominant colors per photo (undocumented algorithm), used by the **Sort by Color** command
- Classify keywords are stored hierarchically, e.g. `Any Vision > Labels > mountain`, with an optional root-keyword override, subgroup lettering (A, B, C…) to avoid a Lightroom keyword-list display bug (>1500 keywords), and an "Include on Export" attribute toggle.
- **Prompt** actions available: **Copy to field**, **Replace pattern** (Lua-subset regex), **Assign to keywords** (comma/semicolon/newline lists, hierarchical "name: value" lines, or JSON output), **Change advanced options** (temperature, model, image size, video format, safety category), and **Transform with Lua code** (full scripting access, with helper globals `Debug`, `hierarchy()`, `json`, `photo`, `parseJSON()`, `text`).
- **Metadata tokens** let prompt text pull in existing photo metadata dynamically: `{Prompt 1}`–`{Prompt 10}`, `{Child Keywords, parent}`, `{Child Collections, parent}`, `{Child Published Collections, parent}`, `{Keyword List}`, `{Descendant Keyword List, ancestor}`, `{Lua Code, ...}`, plus any standard Metadata-panel field.
- Results from both commands can be exported to CSV via **Library > Plug-in Extras > Export Prompt Results to File** / **Export Classify Results to File**.
- **Remove Fields** command strips all Any Vision custom metadata fields from selected photos (keywords untouched); as of v1.23 it can optionally remove only cached Google responses while preserving custom fields.

### Gemini models supported (Prompt)
As of the May 2026 pricing table: `gemini-2.5-flash-lite`, `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-3-flash-preview`, `gemini-3.1-flash-lite` (current default), `gemini-3.1-pro-preview`, `gemini-3.5-flash`. Advanced users can add newer models by editing `GeminiModels.lua` in the plugin folder.

## 6. Related Plugins by John R. Ellis (mentioned on this page)

The page doesn't include a full roster of the author's plugins inline — that lives on the linked index page (not yet fetched): **All Plugins** — `https://johnrellis.com/lightroom/allplugins.htm`. Only these are named directly within the Any Vision page body:

- **Any Menu** (`https://johnrellis.com/lightroom/anymenu.htm`) — invoke any plugin menu item with a few keystrokes, assign single-letter quick keys to frequently used commands; suggested for keyboard shortcuts to Any Vision's **Classify**/**Prompt**.
- **Debugging Toolkit** (`https://johnrellis.com/lightroom/debugging-toolkit.htm`) — provides the `Debug` module (`Debug.logn()`, `Debug.lognpp()`) used inside Any Vision's Lua "Transform with Lua code" action.
- **Any Filter** — referenced only implicitly via a Lua code example reading a custom metadata property (`filterTime`) from plugin id `com.johnrellis.anyfilter`; no description or link given on this page.

## 7. Caveats, Limitations, and Known Issues

- Gemini error "This model … is no longer available" → change **Prompt > Advanced > Default model** to an available model.
- Early May 2026: Google silently cut the free-tier quota for Gemini 2 models to 20 photos/day (from 1000/day); workaround is switching default model to `gemini-3.1-flash-lite-preview` for 500 free photos/day.
- Starting **June 19, 2026**: Gemini requires "secured" API keys tied to specific Google Cloud services; keys created before end of April 2026 are "unsecured" and will start failing — get new keys.
- "These prompts use models that are deprecated" warning → edit each affected prompt and set **Model** to **default**, or delete built-in prompts and re-add via **Add Built-in**.
- Error "Google error: models/gemini-2.5-flash-preview-05-20 is not found…" → update to latest Any Vision version (Google retired older Gemini models on 11/19/2025).
- Requires Lightroom 6.14 (CC 2015) or Lightroom Classic — relies on features absent from earlier versions.
- Upgraders may see "Google error: Generative Language API has not been used in project…" — requires specific remediation steps (anchor `#upgrading-api` on the source page).
- Gemini "recitation" errors or max-token errors in **Prompt** → add a **Change advanced options** action and raise **Temperature** above 0 (even 0.1 can help).
- Overly sensitive content filters (shared with services like Adobe Firefly): innocent photos with exposed skin sometimes get incorrectly flagged.
- Long-standing Google bug: "Google error (13): Internal server error. Unexpected feature response," roughly 1 in a few hundred photos; often avoidable by unchecking Landmarks.
- If the Any Vision window doesn't fit the display, enable **Use Any Vision on small displays** in Plug-in Manager settings.
- Privacy: for free-tier **Prompt** (Gemini) usage, Google may use submitted photos to improve its products; for paid Gemini and for **Classify** (Cloud Vision), Google states it will not use photos for other purposes.
- **Classify** occasionally throws spurious errors ("The request timed out," "Image processing error!") — simply rerun.
- Duplicate keyword names disambiguated via `child < parent` notation in the UI (e.g., `House < Labels`) but both export identically as "House" in metadata.
- No built-in prompt writes to the **Title** field by design (IPTC distinction between Headline and Title); users wanting a synopsis in Title must copy/modify the **IPTC Headline** built-in prompt.

### Prompt vs. Classify
- **Prompt** is more flexible (custom prompts); per author testing, somewhat better at keywording and text extraction (including bib/race numbers). **Classify** is better at dominant colors.
- **Classify** runs 2–4x faster than **Prompt**.
- **Classify** free tier: up to 212,000 photos in the first three months, then 1,000/month thereafter, no speed penalty.
- **Prompt** free tier: no monthly photo cap, but rate-limited (15 photos/min, 500/day with default `gemini-3.1-flash-lite-preview`; much lower for other models).
- **Classify** uses "2016-era technology" Google hasn't meaningfully improved recently; **Prompt** uses actively-developed Gemini.

## 8. Version History Highlights

- **1.18** (2024-09-05): Free-trial users must obtain their own Google Cloud key (shared free-trial key was abused).
- **1.19** (2024-12-05): Added **Prompt** (Gemini-based, video support). **Analyze** renamed **Classify**. Free trial raised to 200 photos. Export split into Prompt/Classify.
- **1.20** (2024-12-31): Metadata token insertion into prompts; multi-select prompt editing; added `gemini-2.0-flash-exp`.
- **1.21** (2025-02-21): Four new Gemini 2.0 models; `gemini-2.0-flash` new default; default-model concept introduced; new **Exposure and Focus** built-in prompt.
- **1.22** (2025-05-12): Export/Import prompts as text files; JSON-schema **From JSON output**; new prompts **Embedded timestamp**, **Cat description**, **Classify cat**; "text only" prompts; added Gemini 2.5 preview models.
- **1.23** (2025-06-12): **Remove Fields** can remove just cached responses; prompts can copy to **GPS**, **GPS Direction**, **GPS Altitude**; video frame-sampling-rate option; added Gemini 2.5 preview models.
- **1.25** (2025-08-18): Final Gemini 2.5 models added; new default `gemini-2.5-flash`; new **Landmarks and Places with GPS** built-in prompt.
- **1.27** (2025-08-25): New default `gemini-2.5-flash-lite` (cheaper); corrected cost-estimate bugs.
- **1.29** (2025-11-07): New **Taxonomic identification of plant or animal** built-in prompt; new Lua `hierarchy()` helper.
- **1.32** (2026-04-26): Google now requires separate API keys for Prompt vs. Classify.
- **1.33** (2026-05-04): Gemini 2.0 models deprecated/slowed ahead of 6/1/2026 shutoff; added deprecation warnings.
- **1.34** (2026-05-09): Gemini 3 Preview models supported; new default `gemini-3.1-flash-lite-preview`; auto-retry on overload errors; batch cost shown in error log; new advanced options (Thinking level, Image/Video Resolution); model-aware Temperature default.
- **1.36** (2026-05-26): `gemini-2.0-flash` and `gemini-3.1-flash-lite-preview` silently turned off by Google; added `gemini-3.1-flash-lite` and `gemini-3.5-flash`.
- **1.37** (2026-06-18, current): New built-in prompt **Keywords – 10 best using your keywords**; new tokens `{Keyword List}` and `{Descendant Keyword List}`; new **Assign to keywords** option **Use existing keywords under ancestor keyword**; bug fixes.

## 9. Links and URLs Worth Preserving

| Purpose | URL |
|---|---|
| Canonical page | `https://johnrellis.com/lightroom/anyvision.htm` |
| Current download (v1.37) | `https://johnrellis.com/lightroom/anyvision.1.37.zip` |
| Buy license ($14.95) | `https://www.e-junkie.com/ecom/gb.php?&c=cart&ejc=2&cl=133241&i=1529347` |
| Google AI Studio API keys | `https://aistudio.google.com/app/api-keys` |
| Enable Cloud Vision API | `https://console.developers.google.com/apis/api/vision.googleapis.com/overview` |
| Enable Cloud Translation API | `https://console.cloud.google.com/apis/api/translate.googleapis.com` |
| Google Cloud credentials console | `https://console.cloud.google.com/apis/credentials` |
| Google Cloud billing console | `https://console.cloud.google.com/billing` |
| Gemini API spend caps docs | `https://ai.google.dev/gemini-api/docs/billing#project-spend-caps` |
| Google Cloud billing alerts docs | `https://cloud.google.com/billing/docs/how-to/budgets` |
| Gemini rate limits docs | `https://ai.google.dev/gemini-api/docs/rate-limits` |
| Gemini pricing | `https://ai.google.dev/pricing` |
| Gemini API terms (free-tier data use) | `https://ai.google.dev/gemini-api/terms` |
| Google Cloud data processing/security terms | `https://cloud.google.com/terms/data-processing-terms` |
| Cloud Vision pricing | `https://cloud.google.com/vision/pricing#prices` |
| Google Cloud Translation product page | `https://cloud.google.com/translate/` |
| Gemini prompting intro guide | `https://ai.google.dev/gemini-api/docs/prompting-intro` |
| Structured output / JSON schema docs | `https://ai.google.dev/gemini-api/docs/structured-output?lang=rest` |
| Gemini 2.0 model update blog post | `https://blog.google/technology/google-deepmind/gemini-model-updates-february-2025/` |
| Secured API key requirement docs | `https://ai.google.dev/gemini-api/docs/api-key#secure-unrestricted-keys` |
| Gemini FAQ | `https://gemini.google.com/faq` |
| Google Cloud Vision product page | `https://cloud.google.com/vision/` |
| Google Translate | `https://translate.google.com/` |
| Lua pattern-matching syntax reference | `http://www.lua.org/manual/5.1/manual.html#5.4.1` |
| Adobe Lightroom Classic SDK docs | `https://developer.adobe.com/lightroom-classic/` |
| Metadata-Viewer Preset Editor plugin (regex.info) | `https://regex.info/blog/lightroom-goodies/metadata-presets` |
| Lightroom keyword-list Windows bug report | `https://community.adobe.com/t5/lightroom-classic-bugs/p-fails-on-large-keyword-lists-windows-only/idi-p/12252283` |
| Lightroom display-size SDK bug report | `https://community.adobe.com/t5/lightroom-classic-bugs/sdk-lrsysteminfo-displayinfo-and-appwindowsize-return-wrong-units-of-pixels-on-windows/idi-p/12719960` |
| AutoHotkey (Windows single-key shortcuts) | `http://www.autohotkey.com/` |
| Any Menu plugin (same author) | `https://johnrellis.com/lightroom/anymenu.htm` |
| Debugging Toolkit plugin (same author) | `https://johnrellis.com/lightroom/debugging-toolkit.htm` |
| All Plugins index (same author, full catalog) | `https://johnrellis.com/lightroom/allplugins.htm` |
| Support email | `ellis-lightroom@johnrellis.com` |
| **Competing/alternative products mentioned** | |
| Peakto (Mac-only photo manager) | `https://cyme.io/en/products/peakto/` |
| Excire (AI keywording/search, Lightroom integration) | `https://www.excire.com/` |
| LrGeniustagAI (Gemini/ChatGPT/Ollama keywording, $15) | `https://lrgenius.com/` |
| MetaMagic (OpenAI/ChatGPT keywording, per-photo charge) | `https://www.metamagicplugin.com/` |
| LrTag (Classify-like tagging, monthly charge) | `https://lrtag.com/` |
| MyKeyworder (manual keywording aid, recurring charge) | `http://mykeyworder.com/` |
| IPTC Headline field definition | `https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#headline` |
| IPTC Title field definition | `https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata#title` |

**Note:** the source page has a minor internal inconsistency on the free-trial photo limit (50 vs. 200) — both figures are preserved above rather than resolved.
