/**
 * Admin Components Index
 * 
 * Exports all admin dashboard components for easy importing.
 */

// Navigation Components
export { AdminSidebar, getAdminSectionFromPath, type AdminSection } from "./admin-sidebar";
export { AdminHeader, getAdminSectionTitle, getAdminSectionDescription } from "./admin-header";

// Dashboard Components
// Note: MigrationDashboard is deprecated - use MigrationManager instead
// MigrationDashboard uses Node.js fs module which is not compatible with browser
export { MigrationManager } from "./migration-manager";
export { AnalyticsOverview } from "./analytics-overview";
export { BlogManager } from "./blog-manager";
export { UserManager } from "./user-manager";
export { ErrorMonitor } from "./error-monitor";
export { SystemHealth } from "./system-health";
export { KeysManager } from "./keys-manager";

// Blog Admin Components
export { AIAgentSteps, type AIAgentStep } from "../blog/admin/ai-agent-steps";
