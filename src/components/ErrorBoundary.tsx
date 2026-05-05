import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: '' }

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, error: err.message + '\n' + (err.stack || '') }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <h2 className="text-lg font-bold text-red-400 mb-2">Something broke:</h2>
          <pre className="text-xs bg-claw-dark p-3 rounded-lg overflow-auto whitespace-pre-wrap">
            {this.state.error}
          </pre>
          <button
            className="btn-primary mt-3 w-full"
            onClick={() => this.setState({ hasError: false, error: '' })}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
