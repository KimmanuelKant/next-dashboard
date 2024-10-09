// src/components/ErrorBoundary.tsx
"use client";
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// ErrorBoundary component to catch JavaScript errors in child components
export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Initialize state
  state: ErrorBoundaryState = { hasError: false };

  // Update state when an error is caught
  static getDerivedStateFromError(error: Error) {
    // Log the error (could be sent to an error reporting service down the line)
    console.error('Error captured in getDerivedStateFromError:', error);
    // Set the error state to display fallback UI
    return { hasError: true };
  }

  // Lifecycle method to catch errors in child components
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log detailed error information
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI when an error occurs
      return <div>Error loading team statistics. Please try again later.</div>;
    }

    // Render child components when there's no error
    return this.props.children;
  }
}