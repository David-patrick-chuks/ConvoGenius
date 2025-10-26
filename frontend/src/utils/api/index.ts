// Import all API clients
import { AgentsApiClient } from './agentsApi';
import { AnalyticsApiClient } from './analyticsApi';
import { AuthApiClient } from './authApi';
import { ChatApiClient } from './chatApi';
import { DeploymentsApiClient } from './deploymentsApi';
import { HealthApiClient } from './healthApi';
import { ResourcesApiClient } from './resourcesApi';
import { SettingsApiClient } from './settingsApi';

// Export all API clients
export { AgentsApiClient } from './agentsApi';
export { AnalyticsApiClient } from './analyticsApi';
export { AuthApiClient } from './authApi';
export { ChatApiClient } from './chatApi';
export { DeploymentsApiClient } from './deploymentsApi';
export { HealthApiClient } from './healthApi';
export { ResourcesApiClient } from './resourcesApi';
export { SettingsApiClient } from './settingsApi';

// Export types
export * from '@/types/api';

// Main API client that combines all modules
export class cortexDeskApiClient {
  static health = HealthApiClient;
  static auth = AuthApiClient;
  static agents = AgentsApiClient;
  static chat = ChatApiClient;
  static deployments = DeploymentsApiClient;
  static resources = ResourcesApiClient;
  static analytics = AnalyticsApiClient;
  static settings = SettingsApiClient;
}
