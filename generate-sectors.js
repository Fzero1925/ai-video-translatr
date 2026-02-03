#!/usr/bin/env node
/**
 * Sector Performance Pages
 * Track S&P 500 sectors performance
 */

const fs = require('fs');
const path = require('path');

const SECTORS = [
    { symbol: 'XLK', name: 'Technology', color: '#00a8e8' },
    { symbol: 'XLF', name: 'Financials', color: '#00d4aa' },
    { symbol: 'XLE', name: 'Energy', color: '#f7931a' },
    { symbol: 'XLV', name: 'Health Care', color: '#e74c3c' },
    { symbol: 'XLI', name: 'Industrials', color: '#9b59b6' },
    { symbol: 'XLP', name: 'Consumer Staples', color: '#2ecc71' },
    { symbol: 'XLY', name: 'Consumer Discretionary', color: '#3498db' },
    { symbol: 'XLB', name: 'Materials', color: '#e67e22' },
    { symbol: 'XLU', name: 'Utilities', color: '#f1c40f' },
    { symbol: 'XLRE', name: 'Real Estate', color: '#1abc9c' },
    { symbol: 'XLC', name: 'Communication Services', color: '#9b59b6' }
];

async function fetchSectorData(symbol) {
    try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`);
        const data = await response.json();
        if (!data.chart?.result?.[0]) return null;
        
        const result = data.chart.result[0];
        const quote = result.indicators?.quote?.[0];
        if (!quote?.close?.[0]) return null;
        
        const prices = quote.close.filter(p => p !== null);
        const current = prices[prices.length - 1];
        const day1 = prices[prices.length - 2] || current;
        const day5 = prices[0] || current;
        
        return {
            price: current,
            change1d: ((current - day1) / day1) * 100,
            change5d: ((current - day5) / day5) * 100
        };
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log('🏭 Generating sector pages...\n');
    
    const sectorsDir = path.join(__dirname, 'sectors');
    if (!fs.existsSync(sectorsDir)) fs.mkdirSync(sectorsDir, { recursive: true });
    
    const sectorData = [];
    
    for (const sector of SECTORS) {
        const data = await fetchSectorData(sector.symbol);
        sectorData.push({ ...sector, ...data });
        
        const html = generateSectorPage(sector, data);
        fs.writeFileSync(path.join(sectorsDir, `${sector.symbol}.html`), html);
        await new Promise(r => setTimeout(r, 50));
    }
    
    // Generate sector overview page
    const overviewHtml = generateOverviewPage(sectorData);
    fs.writeFileSync(path.join(__dirname, 'sectors.html'), overviewHtml);
    
    console.log(`✅ Generated ${SECTORS.length} sector pages`);
    console.log(`✅ Generated sector overview`);
}

function generateSectorPage(sector, data) {
    const change = data?.change1d || 0.5;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sector.name} Sector | ${sector.symbol} ETF Performance</title>
    <meta name="description" content="${sector.name} sector performance today. Track ${sector.symbol} ETF price and market trends before the opening bell.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0e1a; color: #e8eaed; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        nav { background: #111827; padding: 15px 20px; border-bottom: 1px solid #1e3a5f; margin: -20px -20px 30px; }
        nav a { color: ${sector.color}; text-decoration: none; margin-right: 20px; }
        .sector-header { text-align: center; padding: 40px 0; }
        .symbol { font-size: 3em; font-weight: bold; color: ${sector.color}; }
        .sector-name { font-size: 2em; margin: 10px 0; }
        .change { font-size: 1.5em; padding: 10px 20px; border-radius: 8px; display: inline-block; background: rgba(0,0,0,0.3); }
        .change.positive { color: #00d4aa; }
        .change.negative { color: #ff4757; }
        .card { background: #111827; border: 1px solid #1e3a5f; border-radius: 12px; padding: 25px; margin-bottom: 25px; }
        .card h2 { color: ${sector.color}; margin-bottom: 15px; }
        footer { text-align: center; padding: 40px 0; color: #4a5568; border-top: 1px solid #1e3a5f; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <nav><a href="/">← Home</a><a href="/sectors.html">All Sectors</a></nav>
        <div class="sector-header">
            <div class="symbol">${sector.symbol}</div>
            <div class="sector-name">${sector.name}</div>
            <div class="change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</div>
        </div>
        <div class="card">
            <h2>About ${sector.name} Sector</h2>
            <p>The ${sector.name} sector represents companies in the ${sector.name.toLowerCase()} industry. Investors track ${sector.symbol} to gauge ${sector.name.toLowerCase()} industry performance relative to the broader market.</p>
        </div>
        <footer><p>© ${new Date().getFullYear()} Pre-Market Brief</p></footer>
    </div>
</body>
</html>`;
}

function generateOverviewPage(sectors) {
    const rows = sectors.map(s => `
        <tr>
            <td class="symbol"><a href="/sectors/${s.symbol}.html" style="color: ${s.color}">${s.symbol}</a></td>
            <td>${s.name}</td>
            <td class="${(s.change1d || 0) >= 0 ? 'positive' : 'negative'}">${(s.change1d || 0) >= 0 ? '+' : ''}${(s.change1d || 0).toFixed(2)}%</td>
            <td class="${(s.change5d || 0) >= 0 ? 'positive' : 'negative'}">${(s.change5d || 0) >= 0 ? '+' : ''}${(s.change5d || 0).toFixed(2)}%</td>
        </tr>
    `).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sector Performance | S&P 500 Sectors Today</title>
    <meta name="description" content="S&P 500 sector performance today. Track technology, financials, energy, healthcare and all market sectors.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0e1a; color: #e8eaed; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        nav { background: #111827; padding: 15px 20px; border-bottom: 1px solid #1e3a5f; margin: -20px -20px 30px; }
        nav a { color: #00d4aa; text-decoration: none; margin-right: 20px; }
        header { text-align: center; padding: 40px 0; }
        h1 { font-size: 2.2em; background: linear-gradient(135deg, #00d4aa, #00a8e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .card { background: #111827; border: 1px solid #1e3a5f; border-radius: 12px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #1e3a5f; }
        th { background: #0d1117; color: #8b92a8; font-size: 0.8em; }
        td.symbol { font-weight: bold; }
        .positive { color: #00d4aa; }
        .negative { color: #ff4757; }
        footer { text-align: center; padding: 40px 0; color: #4a5568; border-top: 1px solid #1e3a5f; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <nav><a href="/">← Home</a></nav>
        <header>
            <h1>🏭 Sector Performance</h1>
            <p style="color: #8b92a8; margin-top: 10px;">S&P 500 sectors today</p>
        </header>
        <div class="card">
            <table>
                <thead><tr><th>Symbol</th><th>Sector</th><th>1 Day</th><th>5 Day</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        <footer><p>© ${new Date().getFullYear()} Pre-Market Brief</p></footer>
    </div>
</body>
</html>`;
}

main().catch(console.error);
