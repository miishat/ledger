import React, { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { backupToBlob, backupFilename, parseBackupText, restoreBackup } from '../../utils/backup'

export const BackupControls: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = () => {
    const url = URL.createObjectURL(backupToBlob())
    const a = document.createElement('a')
    a.href = url
    a.download = backupFilename()
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const env = parseBackupText(await file.text())
      restoreBackup(env)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid Ledger backup file')
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary/50 transition-colors"
        >
          <Download className="w-4 h-4" /> Export
        </button>
        <label className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-primary/50 transition-colors cursor-pointer">
          <Upload className="w-4 h-4" /> Import
          <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="sr-only" />
        </label>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
