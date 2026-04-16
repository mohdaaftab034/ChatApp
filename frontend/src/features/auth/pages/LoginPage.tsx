import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { loginSchema, LoginFormValues } from "../schemas/auth.schemas";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "../components/PasswordInput";
import { useAuthStore } from "../../../store/authStore";
import { cn } from "../../../lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { loginApi } from "../api/auth.api";
import { maybeRotateKeyPair, unlockOrCreateKeyring } from "../../../lib/e2ee";
import { updateMyPublicKeyApi } from "../../chat/api/chat.api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  }); 

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const auth = await loginApi(data);
      login(auth.user, auth.token, auth.refreshToken);

      const unlocked = await unlockOrCreateKeyring(data.password)
      const rotated = await maybeRotateKeyPair(data.password, 30)
      const activeKey = rotated?.keyId ? rotated : unlocked
      await updateMyPublicKeyApi({
        keyId: activeKey.keyId,
        publicKey: activeKey.publicKey,
      })

      toast.success("Logged in successfully");
      navigate("/");
    } catch (error) {
      toast.error("Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in to your account
          </h1>
          <p className="text-sm text-text-secondary">
            Enter your email and password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-foreground">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              className={cn(
                "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
                errors.email &&
                  "border-destructive focus-visible:ring-destructive",
              )}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none text-foreground">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-text-secondary hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              error={errors.password?.message}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground border-t-transparent" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-foreground hover:underline focus-visible:outline-none"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
