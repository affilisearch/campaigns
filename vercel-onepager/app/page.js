'use client';

import { useEffect, useMemo, useState } from 'react';
import './globals.css';

const SHEET_CSV_URL = 'PASTE_YOUR_GOOGLE_SHEET_CSV_URL_HERE';

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

const fallbackRows = [
  { country: 'Australia', flag: '🇦🇺', campaign: 'Betandplay' },
  { country: 'Australia', flag: '🇦🇺', campaign: 'LuckyCircus' },
  { country: 'Australia', flag: '🇦🇺', campaign: 'Cazimbo' },
  { country: 'Australia', flag: '🇦🇺', campaign: 'Grand Rush Online' },
  { country: 'United Kingdom', flag: '🇬🇧', campaign: 'Bet Ninja' },
  { country: 'United Kingdom', flag: '🇬🇧', campaign: 'GarrisonBet' },
  { country: 'Germany', flag: '🇩🇪', campaign: 'Cazimbo' },
  { country: 'Germany', flag: '🇩🇪', campaign: 'Dolfwin' },
  { country: 'Spain', flag: '🇪🇸', campaign: 'Spinlynx' },
  { country: 'Spain', flag: '🇪🇸', campaign: 'SpinPlatinum' },
  { country: 'Denmark', flag: '🇩🇰', campaign: 'SpinFever' },
  { country: 'Denmark', flag: '🇩🇰', campaign: 'Rooli' }
];

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
        brands: []
      });
    }

    grouped.get(country).brands.push(campaign);
  });

  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default function HomePage() {
  const [rows, setRows] = useState(fallbackRows);
  const [status, setStatus] = useState('Using example data — add your Google Sheet CSV link to connect live data');

  useEffect(() => {
    if (!SHEET_CSV_URL || SHEET_CSV_URL.includes('PASTE_YOUR_GOOGLE_SHEET_CSV_URL_HERE')) {
      return;
    }

    let isMounted = true;

    async function loadSheet() {
      try {
        const response = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Failed to load sheet: ${response.status}`);
        const text = await response.text();
        const parsed = parseCsv(text);

        if (isMounted && parsed.length > 0) {
          setRows(parsed);
          setStatus('Live data from Google Sheets');
        }
      } catch (error) {
        if (isMounted) {
          console.error(error);
          setStatus('Could not load Google Sheet — showing example data instead');
        }
      }
    }

    loadSheet();
    return () => {
      isMounted = false;
    };
  }, []);

  const countries = useMemo(() => groupRows(rows), [rows]);

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <h1 className="title">Campaigns with no limitations</h1>
          <div className="subtitle">No restrictions on CAPs · Easy to update from Google Sheets</div>
          <div className="status">{status}</div>
        </header>

        <section className="notice">
          Use these exact Google Sheet columns in row 1: <code>country</code>, <code>flag</code>, <code>campaign</code>.
          Then publish the sheet as CSV and paste that CSV link into <code>app/page.js</code> where it says <code>SHEET_CSV_URL</code>.
        </section>

        <section className="grid">
          {countries.map((country) => (
            <article className="country" key={country.name}>
              <div className="flag">{country.flag}</div>
              <div className="country-name">{country.name}</div>
              <div className="brand-list">
                {country.brands.map((brand) => (
                  <div className="brand-item" key={brand}>{brand}</div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <div className="footer-note">Partner one-pager • update the sheet, republish CSV, and your page can reflect the new list</div>
      </div>
    </main>
  );
}
