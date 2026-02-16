import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep logs available in devtools while showing a visible fallback.
    // eslint-disable-next-line no-console
    console.error("UI crash captured by ErrorBoundary", error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <main className="app crash-screen">
          <div className="crash-card">
            <h1>UI crashed</h1>
            <p>{this.state.message || "Unknown error"}</p>
            <p>Refresh the page after this message is captured.</p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
