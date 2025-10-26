// Re-export everything from the new modular API structure
export * from './api';

// For backward compatibility, export the main client as default
export { cortexDeskApiClient as default } from './api';
