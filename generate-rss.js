#!/usr/bin/env node
/**
 * Generate RSS feed and archive pages
 */

const fs = require('fs');
const path = require('path');

function generateRSS(stocks) {
    const date = new Date().toUTCString();
    const today = new Date().toISOString().split('T')[0];
    
    const items = stocks.slice(0, 10).map(stock => `
    <item>
      <title>${stock.symbol} ${stock.changePercent >= 0 ? '▲' : '▼'} ${Math.abs(stock.changePercent).toFixed(2)}%</title>
      <link>https://premarketbrief.com/stock/${stock.symbol}</link>
      <pubDate>${date}</pubDate>
      <description><![CDATA[
        <strong>${stock.symbol}</strong> is trading at $${stock.price.toFixed(2)} 
        ${stock.changePercent >= 0 ? 'up' : 'down'} ${Math.abs(stock.changePercent).toFixed(2)}% 
        in pre-market trading.
      ]]></description>
      <guid>https://premarketbrief.com/stock/${stock.symbol}-${today}</guid>
    </item>
  `).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pre-Market Stock Brief</title>
    <link>https://premarketbrief.com</link>
    <description>Daily pre-market stock market briefing with top movers, indices, and analysis.</description>
    <language>en-us</language>
    <lastBuildDate>${date}</lastBuildDate>
    <atom:link href="https://premarketbrief.com/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://premarketbrief.com/logo.png</url>
      <title>Pre-Market Stock Brief</title>
      <link>https://premarketbrief.com</link>
    </image>
    ${items}
  </channel>
</rss>`;
}

function generateArchivePage(dates) {
    const dateList = dates.map(d => {
        const dateObj = new Date(d);
        const formatted = dateObj.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        return `
        <li>
            <a href="/archive/${d}.html">${formatted}</a>
            <span class="meta">Pre-Market Brief</span>
        </li>`;
    }).join('');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Archive | Pre-Market Stock Brief</title>
    <meta name="description" content="Browse historical pre-market stock market briefings and analysis.">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0e1a;
            color: #e8eaed;
            line-height: 1.6;
        }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        header { text-align: center; padding: 40px 0; border-bottom: 1px solid #1e3a5f; margin-bottom: 30px; }
        h1 { 
            font-size: 2em; 
            background: linear-gradient(135deg, #00d4aa, #00a8e8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .back { display: block; margin-bottom: 20px; color: #00d4aa; text-decoration: none; }
        .back:hover { text-decoration: underline; }
        ul { list-style: none; }
        li {
            background: #111827;
            border: 1px solid #1e3a5f;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        li:hover { border-color: #00d4aa; }
        a { color: #fff; text-decoration: none; font-size: 1.1em; }
        a:hover { color: #00d4aa; }
        .meta { color: #8b92a8; font-size: 0.85em; }
        footer {
            text-align: center;
            padding: 40px 0;
            color: #4a5568;
            font-size: 0.85em;
            border-top: 1px solid #1e3a5f;
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📚 Archive</h1>
        </header>
        
        <a href="/" class="back">← Back to Current Brief</a>
        
        <ul>
            ${dateList || '<li style="text-align:center;color:#8b92a8;">No archives yet. Archives are created daily.</li>'}
        </ul>
        
        <footer>
            <p>© ${new Date().getFullYear()} Pre-Market Brief</p>
        </footer>
    </div>
</body>
</html>`;
}

function generateSitemap() {
    const pages = [
        '',
        'nasdaq-premarket-gainers',
        'dow-jones-premarket',
        'sp500-premarket-movers',
        'premarket-volume-leaders',
        'tech-stocks-premarket',
        'meme-stocks-premarket',
        'chinese-stocks-premarket',
        'biotech-premarket-movers',
        'archive'
    ];
    
    const today = new Date().toISOString().split('T')[0];
    
    const urls = pages.map(page => `
  <url>
    <loc>https://premarketbrief.com${page ? '/' + page : ''}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('');
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

async function main() {
    console.log('📰 Generating RSS and sitemap...\n');
    
    // Mock stocks for RSS (in real usage, would fetch actual data)
    const mockStocks = [
        { symbol: 'TSLA', price: 248.50, changePercent: 3.45 },
        { symbol: 'NVDA', price: 875.20, changePercent: 2.87 },
        { symbol: 'AAPL', price: 189.30, changePercent: -1.23 }
    ];
    
    // Generate RSS feed
    const rss = generateRSS(mockStocks);
    fs.writeFileSync(path.join(__dirname, 'feed.xml'), rss);
    console.log('✅ feed.xml');
    
    // Generate sitemap
    const sitemap = generateSitemap();
    fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
    console.log('✅ sitemap.xml');
    
    // Generate archive index
    const archiveDir = path.join(__dirname, 'archive');
    let dates = [];
    if (fs.existsSync(archiveDir)) {
        dates = fs.readdirSync(archiveDir)
            .filter(f => f.endsWith('.html'))
            .map(f => f.replace('.html', ''))
            .sort()
            .reverse();
    }
    
    const archiveHtml = generateArchivePage(dates);
    fs.writeFileSync(path.join(__dirname, 'archive.html'), archiveHtml);
    console.log('✅ archive.html');
    
    // Create archive directory if not exists
    if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir);
        console.log('✅ Created archive/ directory');
    }
    
    // Copy today's index.html to archive
    const today = new Date().toISOString().split('T')[0];
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, path.join(archiveDir, `${today}.html`));
        console.log(`✅ Archived today's brief: archive/${today}.html`);
    }
    
    console.log('\n📝 Files generated for SEO:');
    console.log('  • RSS feed (for news aggregators)');
    console.log('  • XML sitemap (for Google indexing)');
    console.log('  • Archive page (for content depth)');
}

main().catch(console.error);
