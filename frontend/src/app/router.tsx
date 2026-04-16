import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import React, { Suspense } from "react";

// Layouts and Guards
import { AppProviders } from "./providers";

// Lazy loaded pages
const LoginPage = React.lazy(() => import("../features/auth/pages/LoginPage"));
const RegisterPage = React.lazy(
  () => import("../features/auth/pages/RegisterPage"),
);
const ForgotPasswordPage = React.lazy(
  () => import("../features/auth/pages/ForgotPasswordPage"),
);
const OtpVerifyPage = React.lazy(
  () => import("../features/auth/pages/OtpVerifyPage"),
);
const ResetPasswordPage = React.lazy(
  () => import("../features/auth/pages/ResetPasswordPage"),
);
const ProfileSetupPage = React.lazy(
  () => import("../features/auth/pages/ProfileSetupPage"),
);

const ChatPage = React.lazy(() => import("../features/chat/pages/ChatPage"));
const ContactsPage = React.lazy(
  () => import("../features/contacts/pages/ContactsPage"),
);
const SearchPage = React.lazy(
  () => import("../features/search/pages/SearchPage"),
);
const SettingsPage = React.lazy(
  () => import("../features/settings/pages/SettingsPage"),
);
const ProfilePage = React.lazy(
  () => import("../features/profile/pages/ProfilePage"),
);

// Loading Fallback
const Fallback = () => (
  <div className="flex h-screen items-center justify-center bg-page text-foreground">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-foreground"></div>
  </div>
);

// Route Guards
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

const FirstTimeRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !user.username) return <>{children}</>;
  return <Navigate to="/" replace />;
};

const RequireProfileRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !user.username) return <Navigate to="/profile/setup" replace />;
  return <>{children}</>;
};

const router = createBrowserRouter([
  // Public Auth Routes
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Suspense fallback={<Fallback />}>
          <LoginPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <Suspense fallback={<Fallback />}>
          <RegisterPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <PublicRoute>
        <Suspense fallback={<Fallback />}>
          <ForgotPasswordPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: "/verify-otp",
    element: (
      <PublicRoute>
        <Suspense fallback={<Fallback />}>
          <OtpVerifyPage />
        </Suspense>
      </PublicRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <PublicRoute>
        <Suspense fallback={<Fallback />}>
          <ResetPasswordPage />
        </Suspense>
      </PublicRoute>
    ),
  },

  // Profile Setup (Private but requires no username)
  {
    path: "/profile/setup",
    element: (
      <FirstTimeRoute>
        <Suspense fallback={<Fallback />}>
          <ProfileSetupPage />
        </Suspense>
      </FirstTimeRoute>
    ),
  },

  // Protected App Routes (Require full profile)
  {
    path: "/",
    element: (
      <RequireProfileRoute>
        <Suspense fallback={<Fallback />}>
          <ChatPage />
        </Suspense>
      </RequireProfileRoute>
    ),
  },
  {
    path: "/:conversationId",
    element: (
      <RequireProfileRoute>
        <Suspense fallback={<Fallback />}>
          <ChatPage />
        </Suspense>
      </RequireProfileRoute>
    ),
  },
  {
    path: "/contacts",
    element: (
      <RequireProfileRoute>
        <Suspense fallback={<Fallback />}>
          <ContactsPage />
        </Suspense>
      </RequireProfileRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <RequireProfileRoute>
        <Suspense fallback={<Fallback />}>
          <SettingsPage />
        </Suspense>
      </RequireProfileRoute>
    ),
  },
  {
    path: "/profile",
    element: (
      <RequireProfileRoute>
        <Suspense fallback={<Fallback />}>
          <ProfilePage />
        </Suspense>
      </RequireProfileRoute>
    ),
  },
  {
    path: "/profile/:profileId",
    element: (
      <RequireProfileRoute>
        <Suspense fallback={<Fallback />}>
          <ProfilePage />
        </Suspense>
      </RequireProfileRoute>
    ),
  },
]);

export function AppRouter() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
