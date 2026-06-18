Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class APIFuncs {
    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hwnd, StringBuilder lpString, int cch);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowTextLength(IntPtr hWnd);
}
"@

$h = [APIFuncs]::GetForegroundWindow()
$len = [APIFuncs]::GetWindowTextLength($h)
$sb = New-Object System.Text.StringBuilder ($len + 1)
[APIFuncs]::GetWindowText($h, $sb, $sb.Capacity) | Out-Null
$sb.ToString()
