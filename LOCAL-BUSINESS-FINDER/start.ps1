# Fallback Windows sans Python. Écoute uniquement sur localhost.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($PSScriptRoot).TrimEnd('\') + '\'
$listener = New-Object System.Net.HttpListener
$port = 8765
while ($true) {
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add("http://localhost:$port/")
  try { $listener.Start(); break }
  catch { $listener.Close(); $port++; if ($port -gt 8785) { throw 'Aucun port local disponible entre 8765 et 8785.' } }
}
$mime = @{ '.html'='text/html; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.webp'='image/webp'; '.json'='application/json'; '.md'='text/plain; charset=utf-8'; '.txt'='text/plain; charset=utf-8' }
$url = "http://localhost:$port"
Write-Host "`nLOCAL BUSINESS FINDER`n$url`nGardez cette fenetre ouverte. Ctrl+C pour arreter.`n"
Start-Process $url
try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      $response = $context.Response
      $relative = [Uri]::UnescapeDataString($context.Request.Uri.AbsolutePath).TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
      $path = [IO.Path]::GetFullPath([IO.Path]::Combine($root, $relative))
      $allowed = $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and -not ($relative.Split('/') | Where-Object { $_.StartsWith('.') })
      if ($allowed -and (Test-Path $path -PathType Leaf)) {
        $bytes = [IO.File]::ReadAllBytes($path)
        $extension = [IO.Path]::GetExtension($path).ToLowerInvariant()
        $response.ContentType = if ($mime.ContainsKey($extension)) { $mime[$extension] } else { 'application/octet-stream' }
        $response.ContentLength64 = $bytes.Length
        $response.Headers.Add('X-Content-Type-Options', 'nosniff')
        $response.Headers.Add('Cache-Control', 'no-cache')
        $response.Headers.Add('Referrer-Policy', 'strict-origin-when-cross-origin')
        if ($context.Request.HttpMethod -eq 'HEAD') { $response.ContentLength64 = 0 }
        else { $response.OutputStream.Write($bytes, 0, $bytes.Length) }
      } else { $response.StatusCode = 404; $bytes = [Text.Encoding]::UTF8.GetBytes('Fichier introuvable'); $response.OutputStream.Write($bytes, 0, $bytes.Length) }
      $response.OutputStream.Close()
    } catch { try { $context.Response.Abort() } catch {} }
  }
} finally { $listener.Stop(); $listener.Close() }
