
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-6 rounded-2xl flex items-center gap-4 text-red-800 dark:text-red-300">
                    <AlertCircle className="w-8 h-8 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-lg">Une erreur est survenue</h3>
                        <p className="font-mono text-sm mt-1">{this.state.error?.message}</p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/40 rounded-lg text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
