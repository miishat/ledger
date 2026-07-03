import { Plus, Trash2 } from 'lucide-react'

export interface ListEditorColumn<T> {
  key: keyof T & string
  label: string
  type: 'text' | 'number'
  step?: number
}

interface ListEditorProps<T extends { id: string }> {
  title: string
  items: T[]
  columns: ListEditorColumn<T>[]
  makeNew: () => T
  onChange: (next: T[]) => void
}

export function ListEditor<T extends { id: string }>({ title, items, columns, makeNew, onChange }: ListEditorProps<T>) {
  const update = (id: string, key: string, value: string | number) =>
    onChange(items.map((it) => (it.id === id ? { ...it, [key]: value } : it)))
  return (
    <div className="themed-card rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] uppercase tracking-wide text-text-secondary">{title}</p>
        <button
          onClick={() => onChange([...items, makeNew()])}
          className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {items.length === 0 && <p className="text-[13px] text-text-secondary">Nothing yet.</p>}
      {items.map((it) => (
        <div key={it.id} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end border-b border-border pb-3 last:border-b-0">
          {columns.map((c) => (
            <label key={c.key} className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-text-secondary">{c.label}</span>
              <input
                type={c.type}
                step={c.step}
                className="bg-bg-primary/50 border border-border rounded-lg px-3 py-2 text-text-primary text-[15px] outline-none focus:border-accent"
                value={String(it[c.key] ?? '')}
                onChange={(e) => update(it.id, c.key, c.type === 'number' ? Number(e.target.value) : e.target.value)}
              />
            </label>
          ))}
          <button
            onClick={() => onChange(items.filter((x) => x.id !== it.id))}
            className="justify-self-start p-2 rounded-lg text-text-secondary hover:text-error transition-colors"
            aria-label="Remove row"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
