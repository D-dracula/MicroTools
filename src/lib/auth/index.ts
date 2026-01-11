/**
 * Authentication Module Index
 * 
 * Exports all authentication utilities, hooks, and components
 * for easy importing throughout the application.
 */

// Main NextAuth.js configuration
export { authOptions } from '../auth'

// Authentication helper functions
export {
  signUp,
  signIn,
  signInWithOAuth,
  signOut,
  getCurrentSession,
  getCurrentUser,
  resetPassword,
  updatePassword,
  updateProfile,
  onAuthStateChange,
  refreshSession,
} from './auth-helpers'

// Authentication hooks
export {
  useAuth,
  useSignUp,
  useSignIn,
  useSignOut,
  usePasswordReset,
  useProfile,
  useSession,
  useIsAuthenticated,
  useUserProfile,
  // Enhanced session management hooks
  useEnhancedSession,
  useSessionExpiry,
  useAutoLogout,
  useSessionRefresh,
  useSessionPersistence,
} from './auth-hooks'

// Authentication context and providers
export {
  AuthProvider,
  useAuthContext,
  withAuth,
  ProtectedRoute,
} from './auth-context'

// Session management
export {
  SessionManager,
  getSessionManager,
  resetSessionManager,
} from './session-manager'

// Type exports
export type {
  AuthResult,
  SignUpData,
  SignInData,
  OAuthProvider,
} from './auth-helpers'

export type {
  AuthState,
  UseSessionOptions,
  SessionHookResult,
} from './auth-hooks'

export type {
  AuthContextType,
  AuthProviderProps,
  WithAuthProps,
  ProtectedRouteProps,
} from './auth-context'

export type {
  SessionState,
  SessionManagerConfig,
} from './session-manager'