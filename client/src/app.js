import React from 'react';
import ReactDOM from 'react-dom/client';
import './app.css';
import { SmartShiftApp } from './App.jsx';

class RootErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error) {
        console.error(error);
    }

    render() {
        if (this.state.error) {
            return React.createElement(
                'div',
                { className: 'mx-auto mt-10 max-w-2xl rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800' },
                React.createElement('h1', { className: 'text-xl font-black uppercase' }, 'SmartShift failed to load'),
                React.createElement('p', { className: 'mt-3 text-sm' }, 'Something went wrong while loading the application. Refresh the page and try again.'),
            );
        }

        return this.props.children;
    }
}

const rootElement = document.getElementById('app');

if (!rootElement) {
    throw new Error('Missing #app root element.');
}

ReactDOM.createRoot(rootElement).render(
    React.createElement(
        React.StrictMode,
        null,
        React.createElement(
            RootErrorBoundary,
            null,
            React.createElement(SmartShiftApp),
        ),
    ),
);
