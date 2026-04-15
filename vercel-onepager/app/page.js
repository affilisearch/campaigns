'use client';

import { useEffect, useMemo, useState } from 'react';

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
  const [searchTerm, setSearchTerm] = useState('');

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
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let result =
      selectedCountries.length === 0
        ? countries
        : countries.filter((country) => selectedCountries.includes(country.name));

    if (!normalizedSearch) return result;

    return result
      .map((country) => {
        const matchingBrands = country.brands.filter((brand) =>
          brand.toLowerCase().includes(normalizedSearch)
        );

        if (matchingBrands.length === 0) return null;

        return {
          ...country,
          brands: matchingBrands,
        };
      })
      .filter(Boolean);
  }, [countries, selectedCountries, searchTerm]);

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
    setSearchTerm('');
  }

  return (
    <main className="page">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-grid" />
      <div className="bg-noise" />

      <div className="container">
        <header className="hero">
          <div className="hero-inner">
            <div className="eyebrow">Partner overview</div>
            <h1 className="title">Campaigns with no limitations</h1>

            <div className="top-stats">
              <span>No restrictions on CAP’s</span>
              <span className="dot">•</span>
              <span>{rows.length || '—'} Campaigns</span>
              <span className="dot">•</span>
              <span>21 Advertisers</span>
              <span className="dot">•</span>
              <span>{countries.length || '—'} Countries</span>
            </div>

            <div className="status">{status}</div>
          </div>
        </header>

        <section className="filter-shell">
          <div className="filter-bar">
            <button
              onClick={resetFilters}
              className={`filter-pill ${selectedCountries.length === 0 && !searchTerm ? 'active' : ''}`}
            >
              ALL
            </button>

            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search brand..."
              className="brand-search"
            />

            {availableFilters.map((country) => {
              const isSelected = selectedCountries.includes(country.name);

              return (
                <button
                  key={country.name}
                  onClick={() => toggleCountry(country.name)}
                  title={country.name}
                  className={`flag-pill ${isSelected ? 'active' : ''} ${
                    selectedCountries.length > 0 && !isSelected ? 'muted' : ''
                  }`}
                >
                  {country.flag}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid">
          {filteredCountries.map((country) => (
            <article className="country" key={country.name}>
              <div className="country-card">
                <div className="flag">{country.flag}</div>
                <div className="country-name">
                  {country.name} ({country.brands.length})
                </div>
                <div className="brand-list">
                  {country.brands.map((brand) => (
                    <div className="brand-item" key={brand}>
                      {brand}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
