'use client'

import { useState } from 'react'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentArrowDownIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

type ImportStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error'
type ImportType = 'locations' | 'employees'

interface ImportResult {
  success: boolean
  message: string
  details?: {
    imported: number
    failed: number
    errors?: string[]
  }
}

export default function ImportExportPage() {
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importType, setImportType] = useState<ImportType>('locations')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Handle template download
  const downloadTemplate = async (type: ImportType) => {
    try {
      const response = await fetch(`/api/admin/export-template?type=${type}`)
      if (!response.ok) throw new Error('Failed to download template')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-import-template.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading template:', error)
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  // Handle import
  const handleImport = async () => {
    if (!selectedFile) return

    setImportStatus('uploading')
    setImportResult(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('type', importType)

    try {
      setImportStatus('processing')
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        setImportStatus('success')
        setImportResult({
          success: true,
          message: result.message,
          details: result.details
        })
      } else {
        setImportStatus('error')
        setImportResult({
          success: false,
          message: result.error || 'Import failed',
          details: result.details
        })
      }
    } catch (error) {
      setImportStatus('error')
      setImportResult({
        success: false,
        message: 'Failed to import data'
      })
    }
  }

  // Reset form
  const resetForm = () => {
    setImportStatus('idle')
    setImportResult(null)
    setSelectedFile(null)
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-alliance-navy mb-8">Data Import & Export</h1>

      {/* Export Templates Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <DocumentArrowDownIcon className="h-6 w-6 mr-2 text-alliance-red" />
          Download Import Templates
        </h2>
        <p className="text-gray-600 mb-6">
          Download these CSV templates, fill them with your data, then import them back.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => downloadTemplate('locations')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Download Locations Template
          </button>
          
          <button
            onClick={() => downloadTemplate('employees')}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Download Employees Template
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <ArrowUpTrayIcon className="h-6 w-6 mr-2 text-alliance-navy" />
          Import Data
        </h2>

        {/* Import Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Import Type
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setImportType('locations')}
              className={`px-4 py-2 rounded-md border-2 transition-colors ${
                importType === 'locations'
                  ? 'border-alliance-navy bg-alliance-navy text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Locations
            </button>
            <button
              onClick={() => setImportType('employees')}
              className={`px-4 py-2 rounded-md border-2 transition-colors ${
                importType === 'employees'
                  ? 'border-alliance-navy bg-alliance-navy text-white'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Employees
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Upload CSV File
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            disabled={importStatus !== 'idle'}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-alliance-navy file:text-white
              hover:file:bg-alliance-navy-dark
              disabled:opacity-50"
          />
          {selectedFile && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 font-medium">
                ✓ File selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
              <p className="text-sm text-green-600 mt-1">
                Ready to import! Click the "Import Data" button below.
              </p>
            </div>
          )}
        </div>

        {/* Import Button */}
        <div className="flex items-center gap-4 mt-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          {selectedFile && importStatus === 'idle' && (
            <div className="text-3xl animate-bounce mr-2">👉</div>
          )}
          <button
            onClick={handleImport}
            disabled={!selectedFile || importStatus !== 'idle'}
            className={`px-8 py-3 rounded-md font-semibold text-lg transition-all transform ${
              !selectedFile || importStatus !== 'idle'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 shadow-lg'
            }`}
          >
            {importStatus === 'uploading' && '⏳ Uploading...'}
            {importStatus === 'processing' && '⚙️ Processing...'}
            {importStatus === 'idle' && '📤 Import Data'}
            {importStatus === 'success' && '✅ Import Complete'}
            {importStatus === 'error' && '❌ Import Failed'}
          </button>

          {importStatus !== 'idle' && (
            <button
              onClick={resetForm}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Reset
            </button>
          )}
        </div>

        {/* Progress/Status Display */}
        {importStatus === 'processing' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-alliance-navy mr-3"></div>
              <p className="text-sm text-blue-800">Processing your import...</p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {importResult && (
          <div className={`mt-6 p-4 rounded-md ${
            importResult.success ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="flex items-start">
              {importResult.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  importResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importResult.message}
                </p>
                
                {importResult.details && (
                  <div className="mt-2 text-sm">
                    <p className={importResult.success ? 'text-green-700' : 'text-red-700'}>
                      Imported: {importResult.details.imported} | Failed: {importResult.details.failed}
                    </p>
                    
                    {importResult.details.errors && importResult.details.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-700">Errors:</p>
                        <ul className="mt-1 list-disc list-inside text-red-600">
                          {importResult.details.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {importResult.details.errors.length > 5 && (
                            <li>...and {importResult.details.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Import Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>Download the appropriate template CSV file</li>
          <li>Fill in your data following the template format</li>
          <li>Ensure all required fields are populated</li>
          <li>Save the file as CSV and upload it here</li>
        </ol>
        
        <h4 className="font-semibold mt-4 mb-2 text-red-700">Important: Data Dependencies</h4>
        <div className="space-y-3 text-sm">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
            <p className="font-medium">For Locations:</p>
            <ul className="list-disc list-inside mt-1 text-gray-700">
              <li>The organizational hierarchy must exist: Markets → Regions → Districts</li>
              <li><code className="bg-gray-200 px-1">district_id</code> must exist in the districts table</li>
              <li><code className="bg-gray-200 px-1">manager_employee_id</code> must exist in employees (or leave empty)</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
            <p className="font-medium">For Employees:</p>
            <ul className="list-disc list-inside mt-1 text-gray-700">
              <li><code className="bg-gray-200 px-1">user_type_id</code> values: 1=ADMIN, 2=MANAGER, 3=EMPLOYEE, 4=HR, 5=EXECUTIVE</li>
              <li><code className="bg-gray-200 px-1">location_id</code> must exist if creating assignment</li>
              <li><code className="bg-gray-200 px-1">job_title_id</code> must exist if creating assignment</li>
              <li><code className="bg-gray-200 px-1">supervisor_employee_id</code> must be an existing employee (or leave empty)</li>
              <li><code className="bg-gray-200 px-1">termination_reason_id</code> must exist if provided</li>
            </ul>
          </div>
        </div>
        
        <p className="mt-4 text-sm text-gray-600">
          <strong>Tip:</strong> Import in this order: Locations first, then Employees. 
          For circular dependencies (like location managers), leave the field empty on first import 
          and update later.
        </p>
      </div>
    </div>
  )
}