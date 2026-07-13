param(
  [Parameter(Mandatory = $true)]
  [string]$Url,

  [string]$Out = ""
)

$ErrorActionPreference = "Stop"

if ($Out) {
  npm.cmd run resolve -- "$Url" --out "$Out"
} else {
  npm.cmd run resolve -- "$Url"
}
