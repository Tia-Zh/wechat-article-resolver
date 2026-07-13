$ErrorActionPreference = "Stop"

Write-Host "Installing WeChat Article Resolver dependencies..."
npm.cmd install

Write-Host "Installing Playwright Chromium..."
npx.cmd playwright install chromium

Write-Host ""
Write-Host "Install complete."
Write-Host "Try:"
Write-Host '  .\resolve-wechat.cmd "https://mp.weixin.qq.com/s/ARTICLE_ID"'
