@echo off
setlocal

if "%~1"=="" (
  echo Usage: resolve-wechat.cmd "https://mp.weixin.qq.com/s/ARTICLE_ID" [output.md]
  exit /b 2
)

set "URL=%~1"
set "OUT=%~2"

if "%OUT%"=="" (
  npm.cmd run resolve -- "%URL%"
) else (
  npm.cmd run resolve -- "%URL%" --out "%OUT%"
)

