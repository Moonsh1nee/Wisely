Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\moons\AppData\Local\Temp\jcode-browser-1785775200952.png')
$bmp = New-Object System.Drawing.Bitmap($img)
$pts = @(@(5,5), @(400,5), @(770,5), @(5,200), @(400,750), @(400,90))
foreach ($pt in $pts) {
    $c = $bmp.GetPixel($pt[0], $pt[1])
    Write-Output "($($pt[0]),$($pt[1])): R=$($c.R) G=$($c.G) B=$($c.B)"
}
