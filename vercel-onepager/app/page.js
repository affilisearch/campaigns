import './globals.css';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPnWI_pVzKgZOWAvVEAaSaJsob_oUNMOf4ZukA6ScOzMtkw4wIyUE7GCTorH7PSZYsoNitYDuT8d8Y/pub?gid=1075171072&single=true&output=csv';

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    return row;
  });
}

function groupRows(rows) {
  const grouped = new Map();

  rows.forEach((row) => {
    const country = row.country || 'Unknown';
    const flag = row.flag || '🏳️';
    const campaign = row.campaign || '';

    if (!campaign) return;

    if (!grouped.has(country)) {
      grouped.set(country, {
        name: country,
        flag,
        brands: [],
      });
    }

    grouped.get(country).brands.push(campaign);
  });

  return Array.from(grouped.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

async function getRows() {
  try {
    const response = await fetch(SHEET_CSV_URL, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to load sheet: ${response.status}`);
    }

    const text = await response.text();
    const parsed = parseCsv(text);

    return {
      rows: parsed,
      status: 'Live data from Google Sheets',
    };
  } catch (error) {
    console.error(error);
    return {
      rows: [],
      status: 'Could not load Google Sheet',
    };
  }
}

export default async function HomePage() {
  const { rows, status } = await getRows();
  const countries = groupRows(rows);

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <h1 className="title">Campaigns with no limitations</h1>
          <div className="subtitle">
            No restrictions on CAPs · Easy to update from Google Sheets
          </div>
          <div className="status">{status}</div>
        </header>

        <section className="grid">
          {countries.map((country) => (
            <article className="country" key={country.name}>
              <div className="flag">{country.flag}</div>
              <div className="country-name">{country.name}</div>
              <div className="brand-list">
                {country.brands.map((brand) => (
                  <div className="brand-item" key={brand}>
                    {brand}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <div className="footer-note">
          Partner one-pager • update the sheet and the page refreshes automatically
        </div>
      </div>
    </main>
  );
}
