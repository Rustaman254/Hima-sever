"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
// @ts-ignore
import styles from "./auth.module.css";
import { toast } from 'sonner';
import * as auth from "@/lib/auth";
import CustomPhoneInput from "@/components/auth/CustomPhoneInput";
import AuthLayout from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";

import { Suspense } from "react";
// ... imports

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ... rest of the component logic (lines 17-238)
  const redirect = searchParams.get("redirect");

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Toggle Mode
  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    setIsOtpSent(false);
  };

  // --- Admin Login ---
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    toast.loading("Authenticating secure session...");

    try {
      const res = await fetch("http://localhost:8100/api/insurance/admin/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        auth.setToken(data.token);
        auth.setUser(data.user);
        toast.dismiss();
        toast.success("Admin access granted");
        router.push(redirect || "/dashboard/admin");
      } else {
        toast.dismiss();
        toast.error(data.error || "Invalid credentials");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to connect to authentication server");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Login Code Request ---
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return toast.error("Enter your phone number");

    setIsLoading(true);
    toast.loading("Sending WhatsApp login code...");

    try {
      const res = await fetch("http://localhost:8100/api/auth/otp/request", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await res.json();

      if (data.success) {
        toast.dismiss();
        toast.success("Code sent to WhatsApp!");
        setIsOtpSent(true);
      } else {
        toast.dismiss();
        toast.error(data.error || "Failed to send code");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Auth server offline");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Verify Code ---
  const handleVerifyCode = async (otp: string) => {
    setIsLoading(true);
    toast.loading("Verifying code...");

    try {
      const res = await fetch("http://localhost:8100/api/auth/otp/verify", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code: otp })
      });
      const data = await res.json();

      if (data.success) {
        auth.setToken(data.token);
        auth.setUser(data.user);

        toast.dismiss();
        toast.success("Login successful!");

        // Redirect logic based on user role if available, or default
        const userRole = data.user?.role || 'user';
        router.push(redirect || `/dashboard/${userRole}`);
      } else {
        toast.dismiss();
        toast.error(data.error || "Invalid code");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Auth server offline");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout isAdminMode={isAdminMode} onAdminToggle={toggleAdminMode}>
      <h2 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        {isAdminMode ? "Admin Login" : (isOtpSent ? "Verify Code" : "Sign In")}
      </h2>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
        {isAdminMode
          ? "Access the administrative dashboard."
          : (isOtpSent
            ? `Enter the 6-digit code sent to ${phoneNumber}`
            : "Enter your phone number to access you account.")}
      </p>

      {isAdminMode ? (
        // --- Admin Form ---
        <form onSubmit={handleAdminLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@hima.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                outline: 'none'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                outline: 'none'
              }}
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={isLoading} style={{ width: '100%', padding: '1rem', background: 'white', color: 'black', borderRadius: '0.5rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            {isLoading ? "Authenticating..." : "Log In"}
          </button>
        </form>
      ) : (
        // --- User Form ---
        <>
          {!isOtpSent ? (
            <form onSubmit={handleRequestCode}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Phone Number</label>
                <CustomPhoneInput
                  value={phoneNumber}
                  onChange={(phone) => setPhoneNumber(phone)}
                />
              </div>

              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '1rem', background: 'white', color: 'black', borderRadius: '3rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {isLoading ? "Sending..." : "Log In"}
              </button>

              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <a href="/register" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>
                  Don't have an account? <span style={{ marginLeft: '4px', textDecoration: 'underline' }}>Sign Up</span>
                </a>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <OtpInput length={6} onComplete={handleVerifyCode} disabled={isLoading} />

              <button
                onClick={() => setIsOtpSent(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', textDecoration: 'underline', cursor: 'pointer' }}
              >
                Change Phone Number
              </button>
            </div>
          )}
        </>
      )}
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
