import { Component } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'

// Function component so the translation hook can be used (hooks can't run in a class).
function Fallback({ error }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{t('common.error')}</h2>
        <p className="mt-2 break-words text-sm text-muted-foreground">{error?.message ?? ''}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
        >
          Reload
        </button>
      </div>
    </div>
  )
}

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return <Fallback error={this.state.error} />
    }
    return this.props.children
  }
}