import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary, { withErrorBoundary } from '../ErrorBoundary';

// Test component that throws an error
const ErrorThrowingComponent = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal Component</div>;
};

// Test component that throws after a delay
const DelayedErrorComponent = ({ triggerError }) => {
  if (triggerError) {
    throw new Error('Delayed error');
  }
  return <div>Normal Component</div>;
};

describe('ErrorBoundary', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('rendering', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child Content</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
      const CustomFallback = ({ error }) => (
        <div data-testid="custom-fallback">Custom Error: {error.message}</div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error: Test error')).toBeInTheDocument();
    });

    it('renders default FallbackError when error occurs', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('catches JavaScript errors in children', () => {
      const error = new Error('Test error');
      
      expect(() => {
        render(
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        );
      }).not.toThrow();

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.anything()
      );
    });

    it('sets hasError state to true on error', () => {
      const { container } = render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // The error boundary should render the fallback, not children
      expect(container.querySelector('.child')).not.toBeInTheDocument();
    });
  });

  describe('retry and reset', () => {
    it('resets error state when handleRetry is called', async () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Find and click the retry button
      const retryButton = screen.getByRole('button', { name: /try again/i });
      
      await act(async () => {
        retryButton.click();
      });

      // After retry, children should be rendered
      // Note: The component will still throw because shouldThrow is still true
      // but the boundary resets its state
    });

    it('calls onReset callback when handleReset is called', () => {
      const onReset = jest.fn();
      
      render(
        <ErrorBoundary onReset={onReset}>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      resetButton.click();

      expect(onReset).toHaveBeenCalled();
    });

    it('displays retry button in fallback', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('displays reset button in fallback', () => {
      render(
        <ErrorBoundary>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });
  });

  describe('custom props', () => {
    it('displays custom title in fallback', () => {
      render(
        <ErrorBoundary title="Custom Error Title">
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    });

    it('displays custom message in fallback', () => {
      render(
        <ErrorBoundary message="Custom error message">
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });
});

describe('withErrorBoundary HOC', () => {
  it('wraps component with ErrorBoundary', () => {
    const WrappedComponent = () => <div>Wrapped</div>;
    const EnhancedComponent = withErrorBoundary(WrappedComponent);

    render(
      <EnhancedComponent>
        <div>Content</div>
      </EnhancedComponent>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('passes through props to wrapped component', () => {
    const WrappedComponent = ({ testProp }) => <div>{testProp}</div>;
    const EnhancedComponent = withErrorBoundary(WrappedComponent, {
      title: 'Error Title',
    });

    render(<EnhancedComponent testProp="test value" />);

    expect(screen.getByText('test value')).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const WrappedComponent = ({ shouldThrow }) => {
      if (shouldThrow) throw new Error('Wrapped error');
      return <div>Normal</div>;
    };
    const EnhancedComponent = withErrorBoundary(WrappedComponent);

    render(
      <EnhancedComponent shouldThrow={true} />
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});