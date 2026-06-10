'use client'
import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
  sublabel?: string
  badge?: string
}

interface SearchSelectProps {
  options: Option[]
  value: string
  onChange: (value: string, label: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export default function SearchSelect({
  options, value, onChange, placeholder = 'Seleccionar...', searchPlaceholder = 'Buscar...', className = '', disabled = false
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.value === value)

  const filtered = query
    ? options.filter(o => `${o.label} ${o.sublabel || ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 30)
    : options.slice(0, 30)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  function select(opt: Option) {
    onChange(opt.value, opt.label)
    setOpen(false); setQuery('')
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('', '')
    setQuery('')
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={`input w-full text-left flex items-center justify-between gap-2 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-300'}`}
      >
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <span onClick={clear} className="text-gray-300 hover:text-gray-500 text-lg leading-none px-1">×</span>
          )}
          <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
              placeholder={searchPlaceholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-400 text-center">Sin resultados</div>
            ) : (
              <>
                <button type="button" onClick={() => select({ value: '', label: '' })}
                  className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 transition-colors italic">
                  — {placeholder} —
                </button>
                {filtered.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => select(opt)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between gap-2 ${opt.value === value ? 'bg-gray-50 font-medium' : ''}`}
                  >
                    <div>
                      <div className="text-gray-800">{opt.label}</div>
                      {opt.sublabel && <div className="text-xs text-gray-400">{opt.sublabel}</div>}
                    </div>
                    {opt.badge && <span className="text-xs text-gray-400 shrink-0">{opt.badge}</span>}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
