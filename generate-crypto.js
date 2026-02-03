#!/usr/bin/env node
/**
 * Crypto Pre-Market Brief
 * Bitcoin, Ethereum, and major altcoins pre-market analysis
 */

const fs = require('fs');
const path = require('path');

const CRYPTO_SYMBOLS = [
    { symbol: 'BTC-USD', name: 'Bitcoin', icon: '₿' },
    { symbol: 'ETH-USD', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'SOL-USD', name: 'Solana', icon: '◎' },
    { symbol: 'XRP-USD', name: 'XRP', icon: '✕' },
    { symbol: 'ADA-USD', name: 'Cardano', icon: '₳' },
    { symbol: 'DOGE-USD', name: 'Dogecoin', icon: 'Ð' },
    { symbol: 'DOT-USD', name: 'Polkadot', icon: '●' },
    { symbol: 'AVAX-USD', name: 'Avalanche', icon: '▲' },
    { symbol: 'LINK-USD', name: 'Chainlink', icon: '🔗' },
    { symbol: 'MATIC-USD', name: 'Polygon', icon: '⬡' }
];

async function fetchCryptoQuote(symbol) {
    try {
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
        const data = await response.json();
        
        if (!data.chart?.result?.[0]) return null;
        
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];
        
        if (!quote?.close?.[0]) return null;
        
        const current = quote.close[quote.close.length - 1];
        const previous = meta.previousClose || meta.chartPreviousClose || current;
        const change = current - previous;
        const changePercent = (change / previous) * 100;
        
        return {
            symbol: symbol.replace('-USD', ''),
            price: current,
            change,
            changePercent,
            volume: meta.regularMarketVolume || 0
        };
    } catch (e) {
        return null;
    }
}

async function generateCryptoPage() {
    console.log('Fetching crypto data...');
    
    const cryptos = [];
    for (const { symbol, name, icon } of CRYPTO_SYMBOLS) {
        const data = await fetchCryptoQuote(symbol);
        if (data) {
            cryptos.push({ ...data, name, icon });
        }
        await new Promise(r => setTimeout(r, 100));
    }
    
    const sortedByChange = [...cryptos].sort((a, b) => b.changePercent - a.changePercent);
    const gainers = sortedByChange.filter(c => c.changePercent > 0);
    const decliners = sortedByChange.filter(c => c.changePercent < 0);
    
    const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const cryptoTable = cryptos.map(c => `
        <tr class="${c.changePercent >= 0 ? 'positive' : 'negative'}">
            <td class="icon">${c.icon}</td>
            <td class="symbol">${c.symbol}</td>
            <td class="name">${c.name}</td>
            <td class="price">$${c.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: c.price > 100 ? 2 : 4})}</td>
            <td class="change">${c.changePercent >= 0 ? '+' : ''}${c.changePercent.toFixed(2)}%</td>
            <td class="chart">
                <div class="mini-chart ${c.changePercent >= 0 ? 'up' : 'down'}">
                    ${'▁▂▃▄▅▆▇█'.split('').map((bar, i) => `<span>${bar}</span>`).join('')}
                </div>
            </td>
        </tr>
    `).join('');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crypto Pre-Market | Bitcoin, Ethereum & Altcoin Prices</title>
    <meta name="description" content="Cryptocurrency pre-market prices. Bitcoin, Ethereum, Solana and major altcoins before traditional market open.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%);
            color: #e8eaed;
            line-height: 1.6;
            min-height: 100vh;
        }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        header { text-align: center; padding: 40px 0; }
        .crypto-header {
            background: linear-gradient(135deg, #f7931a, #627eea);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .tagline { color: #8b92a8; }
        .date { color: #f7931a; font-family: monospace; margin-top: 10px; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 30px 0;
        }
        .stat-box {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .stat-label { font-size: 0.8em; color: #8b92a8; margin-bottom: 5px; }
        .stat-value { font-size: 1.5em; font-weight: bold; }
        .stat-positive { color: #00d4aa; }
        .stat-negative { color: #ff4757; }
        
        .card {
            background: #111827;
            border: 1px solid #1e3a5f;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 25px;
        }
        .card-header {
            background: linear-gradient(135deg, rgba(247, 147, 26, 0.1), rgba(98, 126, 234, 0.1));
            padding: 20px 25px;
            border-bottom: 1px solid #1e3a5f;
        }
        .card-header h2 { color: #f7931a; font-size: 1.2em; }
        
        table { width: 100%; border-collapse: collapse; }
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #1e3a5f;
        }
        th {
            background: #0d1117;
            color: #8b92a8;
            font-weight: 600;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        tr:hover { background: rgba(247, 147, 26, 0.05); }
        td.icon { font-size: 1.5em; }
        td.symbol { font-weight: bold; color: #fff; }
        td.name { color: #8b92a8; font-size: 0.9em; }
        td.price { font-family: monospace; font-size: 1.1em; }
        td.change { font-weight: bold; }
        .positive { color: #00d4aa; }
        .negative { color: #ff4757; }
        
        .mini-chart {
            display: flex;
            align-items: flex-end;
            height: 30px;
            gap: 2px;
        }
        .mini-chart span {
            font-size: 0.6em;
            opacity: 0.7;
        }
        .mini-chart.up span { color: #00d4aa; }
        .mini-chart.down span { color: #ff4757; }
        
        .news-section {
            background: #111827;
            border: 1px solid #1e3a5f;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
        }
        .news-section h3 {
            color: #627eea;
            margin-bottom: 15px;
        }
        .news-item {
            padding: 15px 0;
            border-bottom: 1px solid #1e3a5f;
        }
        .news-item:last-child { border-bottom: none; }
        .news-title { color: #fff; margin-bottom: 5px; }
        .news-meta { color: #4a5568; font-size: 0.85em; }
        
        .ad-container {
            background: rgba(255,255,255,0.05);
            border: 2px dashed rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 60px 20px;
            text-align: center;
            margin: 25px 0;
            color: #4a5568;
        }
        
        nav { margin-bottom: 20px; }
        nav a {
            color: #f7931a;
            text-decoration: none;
            margin-right: 20px;
        }
        nav a:hover { text-decoration: underline; }
        
        footer {
            text-align: center;
            padding: 40px 0;
            color: #4a5568;
            border-top: 1px solid #1e3a5f;
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <nav>
            <a href="/">← Stock Market</a>
        </nav>
        
        <header>
            <h1 class="crypto-header">🪙 Crypto Pre-Market</h1>
            <p class="tagline">Bitcoin, Ethereum & Major Altcoins</p>
            <p class="date">${date}</p>
        </header>

        <div class="ad-container">
            Crypto Exchange Ads (High CPC)<br>
            <small>Coinbase, Binance, Kraken</small>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>📊 Major Cryptocurrencies</h2>
            </div>
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>24h Change</th>
                        <th>Trend</th>
                    </tr>
                </thead>
                <tbody>
                    ${cryptoTable}
                </tbody>
            </table>
        </div>

        <div class="stats-grid">
            <div class="stat-box">
                <div class="stat-label">Top Gainer</div>
                <div class="stat-value stat-positive">${gainers[0]?.symbol || 'N/A'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Biggest Drop</div>
                <div class="stat-value stat-negative">${decliners[0]?.symbol || 'N/A'}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Gainers</div>
                <div class="stat-value stat-positive">${gainers.length}</div>
            </div>
            <div class="stat-box">
                <div class="stat-label">Decliners</div>
                <div class="stat-value stat-negative">${decliners.length}</div>
            </div>
        </div>

        <div class="ad-container">
            Crypto Trading Platform Ad<br>
            <small>High-converting finance offers</small>
        </div>

        <div class="news-section">
            <h3>🔥 Crypto Market Context</h3>
            <div class="news-item">
                <div class="news-title">24-Hour Trading Activity</div>
                <div class="news-meta">Cryptocurrency markets trade 24/7, unlike traditional stock markets. This page shows the state of crypto markets as US pre-market hours begin.</div>
            </div>
            <div class="news-item">
                <div class="news-title">Bitcoin Dominance</div>
                <div class="news-meta">BTC remains the leading indicator for the overall crypto market sentiment. Major moves often correlate with altcoin performance.</div>
            </div>
            <div class="news-item">
                <div class="news-title">Ethereum & DeFi</div>
                <div class="news-meta">ETH price action affects the broader DeFi ecosystem and NFT markets. Watch for gas price impacts on network activity.</div>
            </div>
        </div>

        <footer>
            <p>© ${new Date().getFullYear()} Pre-Market Brief | Crypto data via Yahoo Finance</p>
            <p style="margin-top: 10px; font-size: 0.8em;">Not investment advice. Crypto is highly volatile.</p>
        </footer>
    </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(__dirname, 'crypto.html'), html);
    console.log('✅ crypto.html generated');
    console.log(`   Bitcoin: $${cryptos.find(c => c.symbol === 'BTC')?.price.toLocaleString() || 'N/A'}`);
    console.log(`   Ethereum: $${cryptos.find(c => c.symbol === 'ETH')?.price.toLocaleString() || 'N/A'}`);
}

generateCryptoPage().catch(console.error);
