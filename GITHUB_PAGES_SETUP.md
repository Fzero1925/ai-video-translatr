# GitHub Pages Setup Instructions

## 启用网站步骤（必须手动操作）

1. 访问 GitHub 仓库设置页面：
   https://github.com/Fzero1925/ai-video-translatr/settings/pages

2. 在 "Source" 部分选择：
   - Branch: `main`
   - Folder: `/ (root)`

3. 点击 "Save"

4. 等待 2-5 分钟，网站将在以下地址可用：
   https://fzero1925.github.io/ai-video-translatr/

## 可选：自定义域名

如果要使用自己的域名，在 "Custom domain" 输入框填入域名，如：
- premarketbrief.com

然后添加 DNS 记录：
- CNAME: @ → fzero1925.github.io
- 或 A 记录指向 GitHub Pages IP 地址

## 当前网站内容

- 总页面数：200+
- 主页面：index.html
- 股票页面：146 个 (/stock/)
- ETF页面：20 个 (/etf/)
- 行业页面：11 个 (/sectors/)
- SEO页面：8 个 (/pages/)
- 工具页面：经济指标、财报日历、股息日历、期货、技术指标等

## 自动更新

- 已配置 GitHub Actions 每天自动更新
- 本地守护进程每3小时更新一次
