'use client'

export function DeleteAllSongsButton({ confirmText, label }: { confirmText: string; label: string }) {
  return (
    <form
      action="/api/band/songs"
      method="post"
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="action" value="delete-all" />
      <button type="submit" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 hover:border-red-400/50">
        {label}
      </button>
    </form>
  )
}
