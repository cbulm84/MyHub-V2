# PowerShell script to fix DashboardLayout in all pages

$files = @(
    "app/(authenticated)/employees/page.tsx",
    "app/(authenticated)/employees/[id]/page.tsx", 
    "app/(authenticated)/employees/new/page.tsx",
    "app/(authenticated)/locations/page.tsx",
    "app/(authenticated)/locations/[id]/page.tsx",
    "app/(authenticated)/locations/new/page.tsx",
    "app/(authenticated)/assignments/page.tsx",
    "app/(authenticated)/assignments/[id]/edit/page.tsx",
    "app/(authenticated)/assignments/new/page.tsx",
    "app/(authenticated)/organization/page.tsx",
    "app/(authenticated)/organization/companies/page.tsx",
    "app/(authenticated)/organization/divisions/page.tsx",
    "app/(authenticated)/organization/market/[id]/page.tsx",
    "app/(authenticated)/organization/new/page.tsx"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    
    # Remove DashboardLayout import
    $content = $content -replace "import DashboardLayout from '@/components/layouts/DashboardLayout'\r?\n", ""
    
    # Remove opening DashboardLayout tag
    $content = $content -replace "\s*<DashboardLayout>\r?\n", ""
    
    # Remove closing DashboardLayout tag
    $content = $content -replace "\s*</DashboardLayout>\r?\n", ""
    
    # Save the file
    Set-Content $file $content -NoNewline
    
    Write-Host "Fixed: $file"
}

Write-Host "All files have been updated!"