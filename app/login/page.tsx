"use client";

import { useState, type FormEvent } from "react";
import { ApiError, saveSession } from "@/lib/api";
import { authApi } from "@/lib/services";
import Header from "../component/Header";

type LoginErrors = {
  email?: string;
  password?: string;
  general?: string;
};
export default function Login() {
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    const formData = new FormData(e.currentTarget)
    const email = String(formData.get("email")??"").trim()
    const password = String(formData.get("password") ?? "").trim();
    const nextErrors: LoginErrors = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email.";
    }
    if (!password) {
      nextErrors.password = "Enter your password.";
    } else if (password.length < 8 || password.length > 20) {
      nextErrors.password = "Password must be 8–20 characters.";
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) { return }
    setLoading(true)
    try {
      const data = await authApi.login({ email, password, rememberMe });
      if (!data?.token) {
        throw new Error("Login response did not contain a token.");
      }
      saveSession(data, rememberMe);
      window.location.href = "/invoices";
    } catch (error) {
      setErrors({
        general:
          error instanceof ApiError && error.status === 401
            ? "Email or password is wrong."
            : error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <Header></Header>
      <div className="text-center m-5">
        <h1 className="title">Welcome Back</h1>
        <p className="subtitle">Log in to your account.</p>
      </div>

      <div className="container w-full max-w-[400px] mx-auto mb-5">
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb_15">
            <label htmlFor="email" className="form_label">
              Email Address*
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              className="form_input"
              onChange={() =>
                setErrors((prev) => ({
                  ...prev,
                  email: undefined,
                  general: undefined,
                }))
              }
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="mb_15">
            <label htmlFor="password" className="form_label">
              Password*
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter password"
                className="form_input"
                onChange={() =>
                  setErrors((prev) => ({
                    ...prev,
                    password: undefined,
                    general: undefined,
                  }))
                }
                aria-invalid={!!errors.password}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-[8px] top-1/2 -translate-y-1/2 text-[#999]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          <label className="flex items-center gap-[6px] cursor-pointer w-fit text-[11px] text-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-[13px] w-[13px] cursor-pointer"
            />
            Remember me
          </label>

          {errors.general && (
            <p className="mt-3 text-sm text-red-500" role="alert">
              {errors.general}
            </p>
          )}

          <div className="flex justify-end my-5">
            <button
              type="submit"
              disabled={loading}
              className="btn btn_bg_primary disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <div className="text-center mt-[19px]">
          <a href="/signup">Create account</a>
        </div>
      </div>
    </>
  );
}
