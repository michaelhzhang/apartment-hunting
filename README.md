# Apartment Hunter

A Chrome extension that saves StreetEasy rental listings to a Google Sheet, automatically calculating transit and walking commute times to your work address.

---

## Setup (one-time)

### 1. Google Sheet + Apps Script

1. Go to [sheets.new](https://sheets.new) and create a blank spreadsheet. Name it whatever you like (e.g. "Apartment Hunt").
2. In the spreadsheet, click **Extensions → Apps Script**.
3. Delete the placeholder code and paste the contents of `apps-script/Code.gs`.
4. Click **Save** (floppy disk icon).
5. Click **Deploy → New deployment**.
   - Click the gear icon next to "Type" and choose **Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Click **Deploy**.
6. Copy the **Web app URL** — it looks like `https://script.google.com/macros/s/LONG_ID/exec`. You'll paste this into the extension settings.

> **Note:** Every time you edit `Code.gs` you must create a **new deployment** (not update an existing one) for changes to take effect.

---

### 2. Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or use an existing one).
3. Go to **APIs & Services → Library** and enable **Distance Matrix API**.
4. Go to **APIs & Services → Credentials** and click **Create credentials → API key**.
5. Copy the key. For personal use you can leave it unrestricted, or restrict it to your extension's ID later.
6. You'll need to have a billing account attached to the project, but the free $200/month credit means personal use costs effectively $0.

---

### 3. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked** and select the `extension/` folder in this repo.
4. The 🏠 icon will appear in your toolbar (you may need to pin it from the puzzle-piece menu).

> **Icons:** Chrome will show a default grey icon until you add PNG files at `extension/icons/icon16.png`, `icon48.png`, and `icon128.png`. Any 16×16, 48×48, and 128×128 PNGs work — or just leave them out during development.

---

### 4. Configure the Extension

1. Click the 🏠 toolbar icon → click ⚙️, or right-click the icon and choose **Options**.
2. Fill in:
   - **Work address** — full address, e.g. `350 5th Ave, New York, NY 10118`
   - **Maps API key** — from step 2
   - **Apps Script URL** — from step 1
3. Click **Save settings**.

---

## Usage

1. Navigate to any StreetEasy rental listing (`streeteasy.com/rental/…`).
2. Click the 🏠 toolbar icon.
3. The popup pre-fills what it can from the page. Review and correct any fields.
4. Click **Save to Google Sheets**.
5. The extension fetches transit and walking commute times (for next Monday at 9 am), then appends a row to your sheet.

---

## Google Sheet columns

| Column | Description |
|---|---|
| Date Added | Date you saved the listing |
| Address | Street address |
| Neighborhood | Neighborhood name |
| Price ($/mo) | Monthly rent |
| Sq Ft | Square footage |
| Transit Commute | e.g. "34 mins" |
| Walking Commute | e.g. "1 hour 12 mins" |
| W/D in Unit | Yes/No |
| Elevator | Yes/No |
| Doorman | Yes/No |
| Dishwasher | Yes/No |
| Link | StreetEasy URL |
| Notes | Your freeform notes |

---

## Troubleshooting

**"Navigate to a StreetEasy rental listing"** — The URL must match `streeteasy.com/building/BUILDING-NAME/UNIT`. Search results and neighborhood pages aren't supported.

**Maps API error** — Double-check that the Distance Matrix API is enabled in your Cloud project and the key is correct.

**Failed to save** — Make sure your Apps Script is deployed as a web app with "Anyone" access. Re-deploy after any code changes.

**Fields aren't auto-filled** — StreetEasy occasionally changes their page structure. Fill in the fields manually and open a GitHub issue with the listing URL so the selectors can be updated.
