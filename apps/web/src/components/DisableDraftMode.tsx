import { useIsPresentationTool } from '@sanity/visual-editing/react'

export default function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool()
  if (isPresentationTool !== false) return null

  return (
    <a
      href="/api/draft-mode/disable"
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        zIndex: 50,
        borderRadius: '9999px',
        padding: '0.5rem 1rem',
        backgroundColor: '#101112',
        color: '#fff',
        fontSize: '0.875rem',
        textDecoration: 'none',
      }}
    >
      Disable preview
    </a>
  )
}
