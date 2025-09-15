# PowerShell script to install React Flow dependencies
# Run this script in the project directory

Write-Host "Installing React Flow dependencies..." -ForegroundColor Green

# Install React Flow packages
pnpm add @reactflow/core @reactflow/controls @reactflow/background @reactflow/minimap react-resizable

# Install TypeScript types
pnpm add -D @types/react-resizable

Write-Host "Dependencies installed successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update your routes to use DashboardFlowEditorWrapper" -ForegroundColor White
Write-Host "2. Test the new implementation" -ForegroundColor White
Write-Host "3. Remove the old DashboardEditor.tsx if everything works" -ForegroundColor White 