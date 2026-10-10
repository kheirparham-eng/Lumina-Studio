import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lumina Studio Uncaught Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-[#070611] text-neutral-100 p-6 select-none relative overflow-hidden font-sans">
          {/* Ambient Caustics Background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-fuchsia-600/20 to-transparent blur-[120px]" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tl from-cyan-600/20 to-transparent blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-md w-full rounded-3xl p-6 sm:p-8 bg-black/60 border border-white/15 backdrop-blur-2xl shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h2 className="text-xl font-black uppercase tracking-wider text-white mb-2">
              Lumina Studio Recovered
            </h2>
            <p className="text-xs text-neutral-300 mb-6 leading-relaxed">
              An unexpected error occurred while rendering the photo workspace. You can refresh the session or restore default settings below.
            </p>

            {this.state.error && (
              <div className="mb-6 max-h-24 overflow-y-auto rounded-xl bg-black/50 border border-white/10 p-3 text-left font-mono text-[11px] text-fuchsia-300/90 break-words">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 shadow-lg shadow-fuchsia-600/30 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Studio
              </button>
              <button
                onClick={this.handleResetStorage}
                className="flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
