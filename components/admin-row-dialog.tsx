'use client'

import { useRef, type ReactNode } from 'react'

type AdminRowDialogProps = {
  triggerLabel: string
  title: string
  children: ReactNode
}

export function AdminRowDialog({ triggerLabel, title, children }: AdminRowDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-100 hover:border-cyan-400/50"
      >
        {triggerLabel}
      </button>

      <dialog
        ref={dialogRef}
        className="w-[min(92vw,48rem)] rounded-3xl border border-white/10 bg-slate-950 p-0 text-slate-100 backdrop:bg-slate-950/70"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">{title}</h2>
            </div>
            <form method="dialog">
              <button className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 hover:border-cyan-400/50">
                Close
              </button>
            </form>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </dialog>
    </>
  )
}
