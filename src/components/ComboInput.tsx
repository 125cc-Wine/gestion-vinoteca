'use client'
import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (val: string) => void
  options: string[]
  placeholder?: string
  className?: string
}

export default function ComboInput({ value, onChange, options, placeholder, className }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = value.trim()
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase())).slice(0, 30)
    : options.slice(0, 50)

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input
        className={className ?? 'input'}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-[200] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(opt => (
            <li key={opt}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false) }}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
