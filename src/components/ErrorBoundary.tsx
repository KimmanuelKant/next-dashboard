// src/components/ErrorBoundary.tsx
"use client";
import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** What failed to load, e.g. "team statistics". Used in the fallback message. */
  what?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Catches render errors in child components and shows a fallback message.
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger" role="alert">
          Error loading {this.props.what ?? "this page"}. Please try again later.
        </div>
      );
    }

    return this.props.children;
  }
}
