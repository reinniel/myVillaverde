import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('myVillaverde could not render', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#EEF1E8] px-5 py-[max(2rem,env(safe-area-inset-top))] text-center" role="alert">
        <div className="w-full max-w-sm rounded-[30px] border border-[#D7DED4] bg-[#FFFDF7] p-7 shadow-xl">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FFF0D8] text-[#9A5A24]" aria-hidden="true">
            <AlertTriangle className="h-7 w-7" />
          </span>
          <h1 className="mt-5 font-serif-header text-2xl font-bold text-[#18241F]">The guide hit a problem</h1>
          <p className="mt-2 text-sm font-medium leading-6 text-[#627066]">Your saved places and trip remain on this device. Reload the guide to try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#26372F] px-6 text-sm font-extrabold text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#26372F]/25">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload myVillaverde
          </button>
        </div>
      </main>
    );
  }
}
