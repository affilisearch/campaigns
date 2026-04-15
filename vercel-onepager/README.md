# Partner campaign one-pager

## What this is
A small Next.js app ready for Vercel. It shows a one-page country overview and can load data from Google Sheets.

## Required Google Sheet columns
Use exactly these column names in row 1:

- country
- flag
- campaign

Example:

| country | flag | campaign |
|---|---|---|
| Australia | 🇦🇺 | Betandplay |
| Australia | 🇦🇺 | LuckyCircus |
| Germany | 🇩🇪 | Cazimbo |

## How to connect Google Sheets
1. Open your Google Sheet.
2. Use **File → Share → Publish to web**.
3. Publish the relevant sheet as **CSV**.
4. Copy the CSV URL.
5. Open `app/page.js`.
6. Replace `PASTE_YOUR_GOOGLE_SHEET_CSV_URL_HERE` with your CSV URL.

## How to deploy on Vercel
1. Go to Vercel.
2. Create a new project.
3. Upload this folder or the zip.
4. Deploy.

