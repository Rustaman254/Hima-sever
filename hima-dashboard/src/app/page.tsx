"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Coins, User, ArrowRight } from "lucide-react";
// @ts-ignore
import styles from "./auth.module.css";
import { toast } from 'sonner';
import * as auth from "../lib/auth";
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [role, setRole] = useState<"admin" | "lp" | "user">("user");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    toast.loading("Authenticating secure session...");

    try {
      if (role === 'admin') {
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
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to connect to authentication server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return toast.error("Enter your phone number");

    setIsLoading(true);
    toast.loading("Sending secure code via WhatsApp...");

    try {
      const res = await fetch("http://localhost:8100/api/auth/whatsapp/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });
      const data = await res.json();

      if (data.success) {
        toast.dismiss();
        toast.success("Code sent! Check your WhatsApp");
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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Enter the 6-digit code");

    setIsLoading(true);
    toast.loading("Verifying code...");

    try {
      const res = await fetch("http://localhost:8100/api/auth/whatsapp/verify", {
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
        router.push(redirect || `/dashboard/${role}`);
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
    <div className={styles.authContainer}>
      <div className={styles.backgroundGlow} />

      <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)', top: '10%', left: '-10%', filter: 'blur(80px)', pointerEvents: 'none' }}></div>

      <div className={styles.authCard}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Shield size={28} color="white" fill="white" />
          </div>
          <h1 className={styles.title}>Hima</h1>
          <p className={styles.subtitle}>Decentralized Insurance Portal</p>
        </div>

        <div className={styles.roleGrid}>
          <button
            onClick={() => setRole("user")}
            className={`${styles.roleOption} ${role === "user" ? styles.roleActive : ""}`}
            type="button"
          >
            <User size={20} />
            User
          </button>
          <button
            onClick={() => setRole("lp")}
            className={`${styles.roleOption} ${role === "lp" ? styles.roleActive : ""}`}
            type="button"
          >
            <Coins size={20} />
            Partner
          </button>
          <button
            onClick={() => setRole("admin")}
            className={`${styles.roleOption} ${role === "admin" ? styles.roleActive : ""}`}
            type="button"
          >
            <Shield size={20} />
            Admin
          </button>
        </div>

        {(role === 'user' || role === 'lp') ? (
          <div style={{ marginTop: '1.5rem' }}>
            {!isOtpSent ? (
              <form onSubmit={handleRequestCode}>
                <div className={styles.inputGroup}>
                  <label className="hima-label">WhatsApp Phone Number</label>
                  <PhoneInput
                    defaultCountry="ke"
                    value={phoneNumber}
                    onChange={(phone) => setPhoneNumber(phone)}
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={isLoading} style={{ background: '#25D366', color: 'white', border: 'none' }}>
                  {isLoading ? "Sending..." : "Login with WhatsApp"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode}>
                <div className={styles.inputGroup}>
                  <label className="hima-label">Verification Code (6-digits)</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="hima-input"
                    maxLength={6}
                    required
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Confirm Code"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.875rem', marginTop: '1rem', width: '100%', cursor: 'pointer' }}
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <div className={styles.inputGroup}>
              <label className="hima-label">Admin Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@hima.com"
                className="hima-input"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className="hima-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="hima-input"
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? "Authenticating..." : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <p className={styles.footerText}>
          Register by messaging Hima on WhatsApp
        </p>
      </div>
    </div>
  );
}
