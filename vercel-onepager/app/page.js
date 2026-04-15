'use client';

import { useEffect, useMemo, useState } from 'react';
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

export default function HomePage() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('Loading data...');
  const [selectedCountries, setSelectedCountries] = useState([]);

  useEffect(() => {
    async function loadSheet() {
      try {
        const response = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load sheet: ${response.status}`);
        }

        const text = await response.text();
        const parsed = parseCsv(text);

        setRows(parsed);
        setStatus('Live data from Google Sheets');
      } catch (error) {
        console.error(error);
        setStatus('Could not load Google Sheet');
      }
    }

    loadSheet();
  }, []);

  const countries = useMemo(() => groupRows(rows), [rows]);

  const availableFilters = useMemo(
    () =>
      countries.map((country) => ({
        name: country.name,
        flag: country.flag,
      })),
    [countries]
  );

  const filteredCountries = useMemo(() => {
    if (selectedCountries.length === 0) return countries;

    return countries.filter((country) =>
      selectedCountries.includes(country.name)
    );
  }, [countries, selectedCountries]);

  function toggleCountry(countryName) {
    setSelectedCountries((current) => {
      if (current.includes(countryName)) {
        return current.filter((name) => name !== countryName);
      }
      return [...current, countryName];
    });
  }

  function resetFilters() {
    setSelectedCountries([]);
  }

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

        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '32px',
          }}
        >
          <button
            onClick={resetFilters}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '999px',
              padding: '8px 14px',
              background: selectedCountries.length === 0 ? '#111827' : '#fff',
              color: selectedCountries.length === 0 ? '#fff' : '#111827',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ALL
          </button>

          {availableFilters.map((country) => {
            const isSelected = selectedCountries.includes(country.name);

            return (
              <button
                key={country.name}
                onClick={() => toggleCountry(country.name)}
                title={country.name}
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '999px',
                  padding: '8px 12px',
                  background: isSelected ? '#111827' : '#fff',
                  color: isSelected ? '#fff' : '#111827',
                  opacity:
                    selectedCountries.length === 0 || isSelected ? 1 : 0.45,
                  cursor: 'pointer',
                  fontSize: '24px',
                  lineHeight: 1,
                }}
              >
                {country.flag}
              </button>
            );
          })}
        </section>

        <section className="grid">
          {filteredCountries.map((country) => (
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
          Partner one-pager • click flags to filter countries
        </div>
      </div>
    </main>
  );
}
