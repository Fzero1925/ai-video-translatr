#!/usr/bin/env node
/**
 * Generate SEO landing pages for long-tail keywords
 */

const fs = require('fs');
const path = require('path');

// High-value long-tail keywords for pre-market trading
const KEYWORD_PAGES = [
    {
        slug: 'nasdaq-premarket-gainers',
        title: 'Nasdaq Pre-Market Gainers Today | Top 20 Movers',
        h1: 'Nasdaq Pre-Market Gainers',
        description: 'Real-time Nasdaq pre-market gainers. Track the biggest movers before the market opens. Updated daily at 8:30 AM ET.',
        keywords: ['nasdaq premarket gainers', 'nasdaq pre market movers', 'nasdaq stocks up today'],
        filter: (stock) => stock.changePercent > 0
    },
    {
        slug: 'dow-jones-premarket',
        title: 'Dow Jones Pre-Market | DJIA Futures & Movers',
        h1: 'Dow Jones Pre-Market Analysis',
        description: 'Dow Jones Industrial Average pre-market data. DJIA futures, top gainers and decliners before the opening bell.',
        keywords: ['dow jones premarket', 'djia pre market', 'dow futures today'],
        filter: null // Special handling for indices
    },
    {
        slug: 'sp500-premarket-movers',
        title: 'S&P 500 Pre-Market Movers | Top Gainers & Losers',
        h1: 'S&P 500 Pre-Market Movers',
        description: 'S&P 500 pre-market movers today. Track SPY, SPX gainers and decliners before 9:30 AM market open.',
        keywords: ['sp500 premarket', 'spy pre market', 'spx movers today'],
        filter: (stock) => true
    },
    {
        slug: 'premarket-volume-leaders',
        title: 'Pre-Market Volume Leaders | Most Active Stocks',
        h1: 'Pre-Market Volume Leaders',
        description: 'Most active stocks in pre-market trading. High volume movers indicating institutional activity before the bell.',
        keywords: ['premarket volume leaders', 'highest volume premarket', 'most active stocks today'],
        filter: (stock) => stock.volume > 0,
        sort: 'volume'
    },
    {
        slug: 'tech-stocks-premarket',
        title: 'Tech Stocks Pre-Market | FAANG & Semiconductor Movers',
        h1: 'Tech Stocks Pre-Market',
        description: 'Technology stocks pre-market performance. FAANG, semiconductor, and AI stocks moving before market open.',
        keywords: ['tech stocks premarket', 'faang pre market', 'nvidia premarket', 'apple premarket'],
        symbols: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'AMD', 'TSLA', 'NFLX', 'CRM']
    },
    {
        slug: 'meme-stocks-premarket',
        title: 'Meme Stocks Pre-Market | GME, AMC & Retail Favorites',
        h1: 'Meme Stocks Pre-Market',
        description: 'Meme stocks pre-market trading activity. GME, AMC, and retail investor favorites moving before the bell.',
        keywords: ['meme stocks premarket', 'gme premarket', 'amc pre market', 'retail stocks today'],
        symbols: ['GME', 'AMC', 'BB', 'NOK', 'PLTR', 'SOFI', 'COIN', 'HOOD']
    },
    {
        slug: 'chinese-stocks-premarket',
        title: 'Chinese Stocks Pre-Market | Alibaba, PDD, JD Movers',
        h1: 'Chinese Stocks Pre-Market',
        description: 'China stocks ADR pre-market performance. Alibaba, PDD, JD.com and other Chinese equities before market open.',
        keywords: ['chinese stocks premarket', 'alibaba premarket', 'pdd stock premarket', 'china adr'],
        symbols: ['BABA', 'PDD', 'JD', 'BIDU', 'NIO', 'XPEV', 'LI', 'TCOM', 'EDU', 'TAL']
    },
    {
        slug: 'biotech-premarket-movers',
        title: 'Biotech Pre-Market Movers | FDA News & Clinical Trials',
        h1: 'Biotech Pre-Market Movers',
        description: 'Biotech stocks pre-market movers. FDA approvals, clinical trial results, and pharmaceutical news before market open.',
        keywords: ['biotech premarket', 'biotech stocks today', 'fda approval stocks'],
        symbols: ['MRNA', 'BNTX', 'VXRT', 'INO', 'SRNE', 'CODX', 'REGN', 'GILD', 'AMGN', 'BIIB']
    }
];

// Yahoo Finance fetch (reuse from main script)
async function fetchQuote(symbol) {
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
            symbol,
            price: current,
            change,
            changePercent,
            volume: meta.regularMarketVolume || 0
        };
    } catch (e) {
        return null;
    }
}

async function fetchCompanyName(symbol) {
    try {
        const response = await fetch(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=assetProfile`);
        const data = await response.json();
        return data.quoteSummary?.result?.[0]?.assetProfile?.longBusinessSummary?.substring(0, 100) || '';
    } catch {
        return '';
    }
}

function generateLandingPage(config, stocks) {
    const date = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const sortedStocks = config.sort === 'volume' 
        ? stocks.sort((a, b) => b.volume - a.volume).slice(0, 20)
        : stocks.sort((a, b) => b.changePercent - a.changePercent).slice(0, 20);
    
    const stocksHtml = sortedStocks.map(stock => `
        <tr class="${stock.changePercent >= 0 ? 'positive' : 'negative'}">
            <td class="symbol">${stock.symbol}</td>
            <td class="price">$${stock.price.toFixed(2)}</td>
            <td class="change">${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%</td>
            <td class="volume">${(stock.volume / 1000000).toFixed(2)}M</td>
        </tr>
    `).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <meta name="description" content="${config.description}">
    <meta name="keywords" content="${config.keywords.join(', ')}">
    <link rel="canonical" href="https://premarketbrief.com/${config.slug}">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0e1a;
            color: #e8eaed;
            line-height: 1.6;
        }
        .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
        nav {
            background: #111827;
            padding: 15px 20px;
            border-bottom: 1px solid #1e3a5f;
            margin-bottom: 20px;
        }
        nav a {
            color: #00d4aa;
            text-decoration: none;
            margin-right: 20px;
            font-size: 0.9em;
        }
        nav a:hover { text-decoration: underline; }
        header { text-align: center; padding: 30px 0; }
        h1 { 
            font-size: 2.2em; 
            background: linear-gradient(135deg, #00d4aa, #00a8e8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .date { color: #00d4aa; font-size: 0.9em; font-family: monospace; }
        .intro {
            background: #111827;
            border: 1px solid #1e3a5f;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
        }
        .intro p { color: #8b92a8; margin-bottom: 15px; }
        .intro p:last-child { margin-bottom: 0; }
        .card {
            background: #111827;
            border: 1px solid #1e3a5f;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 25px;
        }
        .card-header {
            background: linear-gradient(135deg, rgba(0, 212, 170, 0.1), rgba(0, 168, 232, 0.1));
            padding: 20px 25px;
            border-bottom: 1px solid #1e3a5f;
        }
        .card-header h2 { color: #00d4aa; font-size: 1.2em; }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #1e3a5f;
        }
        th {
            background: #0d1117;
            color: #8b92a8;
            font-weight: 600;
            font-size: 0.85em;
            text-transform: uppercase;
        }
        tr:last-child td { border-bottom: none; }
        tr:hover { background: rgba(0, 212, 170, 0.05); }
        .symbol { font-weight: bold; color: #fff; }
        .price { font-family: monospace; }
        .positive { color: #00d4aa; }
        .negative { color: #ff4757; }
        .volume { color: #8b92a8; font-family: monospace; }
        .update-time {
            text-align: center;
            color: #4a5568;
            font-size: 0.8em;
            margin: 20px 0;
        }
        .ad-container {
            background: #1a1f2e;
            border: 2px dashed #2d3748;
            border-radius: 8px;
            padding: 60px 20px;
            text-align: center;
            margin: 25px 0;
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
        .faq {
            margin-top: 40px;
        }
        .faq h3 {
            color: #00d4aa;
            margin: 25px 0 15px;
        }
        .faq p {
            color: #8b92a8;
            line-height: 1.8;
        }
    </style>
</head>
<body>
    <nav>
        <div class="container">
            <a href="/">← Back to Home</a>
            <a href="/nasdaq-premarket-gainers">Nasdaq</a>
            <a href="/dow-jones-premarket">Dow Jones</a>
            <a href="/sp500-premarket-movers">S&P 500</a>
        </div>
    </nav>
    
    <div class="container">
        <header>
            <h1>${config.h1}</h1>
            <p class="date">${date}</p>
        </header>

        <div class="ad-container">
            AdSense Display Ad (Responsive)<br>
            <small>${config.keywords[0]} - High CPC</small>
        </div>

        <div class="intro">
            <p><strong>What is ${config.h1}?</strong></p>
            <p>${config.description} These stocks are actively trading before the official market open at 9:30 AM ET.</p>
            <p><strong>Why it matters:</strong> Pre-market movements often indicate institutional positioning, earnings reactions, and overnight news impact. Smart traders monitor these levels to prepare for the regular session.</p>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>📊 ${config.h1} - Real Time</h2>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Price</th>
                        <th>Change %</th>
                        <th>Volume</th>
                    </tr>
                </thead>
                <tbody>
                    ${stocksHtml || '<tr><td colspan="4" style="text-align:center;color:#8b92a8;padding:40px;">Loading market data...</td></tr>'}
                </tbody>
            </table>
        </div>

        <div class="ad-container">
            AdSense In-Feed Ad<br>
            <small>Financial Services Targeting</small>
        </div>

        <div class="faq">
            <h3>What time does pre-market trading start?</h3>
            <p>Pre-market trading typically runs from 4:00 AM to 9:30 AM Eastern Time. However, the most liquid period is usually between 8:00 AM and 9:30 AM ET when institutional participants are most active.</p>
            
            <h3>Why do stocks move in pre-market?</h3>
            <p>Pre-market moves are driven by overnight earnings reports, economic data releases, global market developments, analyst upgrades/downgrades, and breaking news that affects specific companies or sectors.</p>
            
            <h3>Should I trade during pre-market hours?</h3>
            <p>Pre-market trading carries higher risks due to lower liquidity and wider spreads. It's generally recommended for experienced traders. Many investors use pre-market data to prepare strategies for the regular session rather than executing trades.</p>
        </div>

        <div class="update-time">
            Last updated: ${new Date().toLocaleString('en-US', {timeZone: 'America/New_York'})} EST
        </div>

        <footer>
            <p>© ${new Date().getFullYear()} Pre-Market Brief | Data provided by Yahoo Finance</p>
            <p style="margin-top: 10px; font-size: 0.8em;">Not investment advice. For educational purposes only.</p>
        </footer>
    </div>
</body>
</html>`;
}

async function main() {
    console.log('🎯 Generating SEO landing pages...\n');
    
    // Create pages directory
    const pagesDir = path.join(__dirname, 'pages');
    if (!fs.existsSync(pagesDir)) {
        fs.mkdirSync(pagesDir);
    }
    
    // Fetch data for all stocks
    const allSymbols = [...new Set(KEYWORD_PAGES.flatMap(p => p.symbols || []))];
    const stocks = [];
    
    for (const symbol of allSymbols) {
        const data = await fetchQuote(symbol);
        if (data) {
            stocks.push(data);
        }
        await new Promise(r => setTimeout(r, 100));
    }
    
    // Generate each landing page
    for (const config of KEYWORD_PAGES) {
        const filteredStocks = config.symbols 
            ? stocks.filter(s => config.symbols.includes(s.symbol))
            : stocks.filter(s => !config.filter || config.filter(s));
        
        const html = generateLandingPage(config, filteredStocks);
        const filePath = path.join(pagesDir, `${config.slug}.html`);
        fs.writeFileSync(filePath, html);
        
        console.log(`✅ ${config.slug}.html - ${filteredStocks.length} stocks`);
    }
    
    console.log(`\n📁 Generated ${KEYWORD_PAGES.length} landing pages in /pages/`);
    console.log('\nKeywords covered:');
    KEYWORD_PAGES.forEach(p => {
        console.log(`  • ${p.keywords[0]}`);
    });
}

main().catch(console.error);
