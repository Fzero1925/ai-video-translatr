#!/usr/bin/env node
/**
 * Pre-Market Stock Brief Generator
 * Fetches market data and generates static HTML
 */

const fs = require('fs');
const path = require('path');

// Yahoo Finance API endpoints
const YF_API = {
    quote: (symbol) => `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
    trending: 'https://query1.finance.yahoo.com/v1/finance/trending/US'
};

// Major indices
const INDICES = ['^GSPC', '^DJI', '^IXIC', '^VIX'];

// Common pre-market movers to track
const TRACKED_STOCKS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD',
    'NFLX', 'BABA', 'PDD', 'JD', 'COIN', 'PLTR', 'SOFI'
];

async function fetchQuote(symbol) {
    try {
        const response = await fetch(YF_API.quote(symbol));
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
            symbol: symbol.replace('^', ''),
            price: current,
            change: change,
            changePercent: changePercent,
            volume: meta.regularMarketVolume || 0
        };
    } catch (e) {
        console.error(`Error fetching ${symbol}:`, e.message);
        return null;
    }
}

async function fetchAllData() {
    console.log('Fetching market data...');
    
    // Fetch indices
    const indices = [];
    for (const symbol of INDICES) {
        const data = await fetchQuote(symbol);
        if (data) {
            indices.push({
                name: symbol === '^GSPC' ? 'S&P 500' : 
                      symbol === '^DJI' ? 'Dow Jones' :
                      symbol === '^IXIC' ? 'Nasdaq' : 'VIX',
                ...data
            });
        }
    }
    
    // Fetch stocks
    const stocks = [];
    for (const symbol of TRACKED_STOCKS) {
        const data = await fetchQuote(symbol);
        if (data) {
            // Fetch company name
            try {
                const summaryRes = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=quoteType`);
                const summary = await summaryRes.json();
                data.company = summary.quoteSummary?.result?.[0]?.quoteType?.longName || symbol;
            } catch {
                data.company = symbol;
            }
            stocks.push(data);
        }
        await new Promise(r => setTimeout(r, 100)); // Rate limiting
    }
    
    // Sort by change percent
    const gainers = stocks.filter(s => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 10);
    const decliners = stocks.filter(s => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 10);
    const active = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 10);
    
    return { indices, gainers, decliners, active };
}

async function generateAIAnalysis(data) {
    // Simple rule-based analysis (can be enhanced with actual AI)
    const { indices, gainers, decliners } = data;
    
    const nasdaq = indices.find(i => i.name === 'Nasdaq');
    const sp500 = indices.find(i => i.name === 'S&P 500');
    
    let sentiment = 'neutral';
    if (nasdaq?.changePercent > 0.5 && sp500?.changePercent > 0.3) sentiment = 'bullish';
    else if (nasdaq?.changePercent < -0.5 || sp500?.changePercent < -0.3) sentiment = 'bearish';
    
    const topGainer = gainers[0];
    const topDecliner = decliners[0];
    
    return {
        sentiment,
        summary: `Pre-market shows ${sentiment} sentiment. ${topGainer ? `${topGainer.symbol} leading gains at +${topGainer.changePercent.toFixed(2)}%.` : ''} ${topDecliner ? `${topDecliner.symbol} down ${topDecliner.changePercent.toFixed(2)}%.` : ''}`,
        keyLevels: `S&P 500 ${sp500?.changePercent >= 0 ? 'holding' : 'testing'} support at ${sp500?.price.toFixed(2)}.`,
        watchlist: gainers.slice(0, 3).map(s => s.symbol).join(', ')
    };
}

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
}

async function generateHTML(data) {
    const analysis = await generateAIAnalysis(data);
    const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const indicesHtml = data.indices.map(idx => `
        <div class="index-item">
            <div class="index-name">${idx.name}</div>
            <div class="index-value">${idx.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            <div class="index-change ${idx.changePercent >= 0 ? 'positive' : 'negative'}">
                ${idx.changePercent >= 0 ? '+' : ''}${idx.changePercent.toFixed(2)}%
            </div>
        </div>
    `).join('');
    
    const renderStocks = (stocks) => stocks.map(stock => `
        <li class="stock-item">
            <div class="stock-info">
                <div class="stock-symbol">${stock.symbol}</div>
                <div class="stock-name">${stock.company || stock.symbol}</div>
            </div>
            <div class="stock-change">
                <div class="change-percent ${stock.changePercent >= 0 ? 'positive' : 'negative'}">
                    ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
                </div>
                <div class="change-value">${stock.change >= 0 ? '+' : ''}$${Math.abs(stock.change).toFixed(2)}</div>
            </div>
        </li>
    `).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pre-Market Stock Brief | ${date}</title>
    <meta name="description" content="Daily pre-market stock briefing for ${date}. Top gainers, decliners, and market analysis before the bell.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0e1a;
            color: #e8eaed;
            line-height: 1.6;
        }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        header { 
            text-align: center; 
            padding: 40px 0; 
            border-bottom: 1px solid #1e3a5f;
            margin-bottom: 30px;
        }
        h1 { 
            font-size: 2.5em; 
            background: linear-gradient(135deg, #00d4aa, #00a8e8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .tagline { color: #8b92a8; font-size: 1.1em; }
        .date { 
            color: #00d4aa; 
            font-size: 0.9em; 
            margin-top: 15px;
            font-family: monospace;
        }
        .card {
            background: #111827;
            border: 1px solid #1e3a5f;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
        }
        .card h2 {
            color: #00d4aa;
            font-size: 1.3em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .index-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .index-item {
            background: #0d1117;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #00d4aa;
        }
        .index-name { font-size: 0.85em; color: #8b92a8; margin-bottom: 5px; }
        .index-value { font-size: 1.8em; font-weight: bold; }
        .index-change { font-size: 0.9em; margin-top: 5px; }
        .positive { color: #00d4aa; }
        .negative { color: #ff4757; }
        .stock-list { list-style: none; }
        .stock-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #1e3a5f;
        }
        .stock-item:last-child { border-bottom: none; }
        .stock-info { flex: 1; }
        .stock-symbol { font-weight: bold; font-size: 1.1em; color: #fff; }
        .stock-name { font-size: 0.85em; color: #8b92a8; }
        .stock-change { text-align: right; }
        .change-percent { font-size: 1.2em; font-weight: bold; }
        .change-value { font-size: 0.85em; color: #8b92a8; }
        .analysis {
            background: linear-gradient(135deg, rgba(0, 212, 170, 0.1), rgba(0, 168, 232, 0.1));
            border-left: 4px solid #00a8e8;
        }
        .analysis-text { line-height: 1.8; color: #c9d1d9; }
        .analysis p { margin-bottom: 15px; }
        .sentiment { 
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .sentiment.bullish { background: rgba(0, 212, 170, 0.2); color: #00d4aa; }
        .sentiment.bearish { background: rgba(255, 71, 87, 0.2); color: #ff4757; }
        .sentiment.neutral { background: rgba(139, 146, 168, 0.2); color: #8b92a8; }
        .ad-container {
            background: #1a1f2e;
            border: 2px dashed #2d3748;
            border-radius: 8px;
            padding: 60px 20px;
            text-align: center;
            margin: 30px 0;
            color: #4a5568;
        }
        footer {
            text-align: center;
            padding: 40px 0;
            color: #4a5568;
            font-size: 0.85em;
            border-top: 1px solid #1e3a5f;
            margin-top: 40px;
        }
        .update-time {
            text-align: center;
            color: #4a5568;
            font-size: 0.8em;
            margin-top: 20px;
        }
    </style>
    <!-- Google AdSense Script (Add your ID later) -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
</head>
<body>
    <div class="container">
        <header>
            <h1>📈 Pre-Market Brief</h1>
            <p class="tagline">Daily stock market intelligence before the bell</p>
            <p class="date">${date}</p>
        </header>

        <!-- AdSense Top Banner -->
        <div class="ad-container">
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                 data-ad-slot="XXXXXXXXXX"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>

        <!-- Market Overview -->
        <div class="card">
            <h2>🌅 Pre-Market Indices</h2>
            <div class="index-grid">
                ${indicesHtml}
            </div>
        </div>

        <!-- AdSense In-Article -->
        <div class="ad-container">
            <ins class="adsbygoogle"
                 style="display:block; text-align:center;"
                 data-ad-layout="in-article"
                 data-ad-format="fluid"
                 data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                 data-ad-slot="XXXXXXXXXX"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>

        <!-- Top Movers -->
        <div class="card">
            <h2>🚀 Top Pre-Market Gainers</h2>
            <ul class="stock-list">
                ${renderStocks(data.gainers.slice(0, 10))}
            </ul>
        </div>

        <div class="card">
            <h2>📉 Top Pre-Market Decliners</h2>
            <ul class="stock-list">
                ${renderStocks(data.decliners.slice(0, 10))}
            </ul>
        </div>

        <!-- Most Active -->
        <div class="card">
            <h2>🔥 Most Active Pre-Market</h2>
            <ul class="stock-list">
                ${renderStocks(data.active.slice(0, 10))}
            </ul>
        </div>

        <!-- AI Analysis -->
        <div class="card analysis">
            <h2>🤖 Market Analysis</h2>
            <div class="analysis-text">
                <p><strong>Sentiment:</strong> <span class="sentiment ${analysis.sentiment}">${analysis.sentiment}</span></p>
                <p><strong>Summary:</strong> ${analysis.summary}</p>
                <p><strong>Key Levels:</strong> ${analysis.keyLevels}</p>
                <p><strong>Watchlist:</strong> ${analysis.watchlist}</p>
            </div>
        </div>

        <!-- AdSense Bottom -->
        <div class="ad-container">
            <ins class="adsbygoogle"
                 style="display:block"
                 data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                 data-ad-slot="XXXXXXXXXX"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
        </div>

        <div class="update-time">
            Data updated: ${new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})} EST
        </div>

        <footer>
            <p>Pre-Market Brief &copy; ${new Date().getFullYear()}</p>
            <p style="margin-top: 10px; font-size: 0.8em;">
                Data provided by Yahoo Finance | For informational purposes only. Not investment advice.
            </p>
        </footer>
    </div>
</body>
</html>`;
}

async function main() {
    console.log('🚀 Generating Pre-Market Brief...\n');
    
    const data = await fetchAllData();
    
    console.log('✓ Fetched', data.indices.length, 'indices');
    console.log('✓ Fetched', data.gainers.length + data.decliners.length, 'stocks');
    
    const html = await generateHTML(data);
    
    const outputPath = path.join(__dirname, 'index.html');
    fs.writeFileSync(outputPath, html);
    
    console.log('\n✅ Generated:', outputPath);
    console.log('\nNext steps:');
    console.log('1. git add index.html && git commit -m "Update"');
    console.log('2. git push origin main');
}

main().catch(console.error);
