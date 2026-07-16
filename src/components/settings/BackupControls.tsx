import React, { useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { backupToBlob, backupFilename, parseBackupText, restoreBackup } from '../../utils/backup'

export const BackupControls: React.FC = () => {
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
    if (!file) {
      e.target.value = ''
      return
    }
    try {
      const env = parseBackupText(await file.text())
      restoreBackup(env)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid Ledger backup file')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-[13px] text-text-secondary hover:text-accent hover:border-accent transition-colors"
        >
          <Download className="w-4 h-4" /> Export data
        </button>
        <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-[13px] text-text-secondary hover:text-accent hover:border-accent transition-colors cursor-pointer">
          <Upload className="w-4 h-4" /> Import backup
          <input type="file" accept="application/json" onChange={handleImport} className="sr-only" />
        </label>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
