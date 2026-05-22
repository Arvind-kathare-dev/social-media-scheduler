"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep(2);
      } else {
        setError(data.message || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStep(3);
      } else {
        setError(data.message || "Invalid OTP or failed to reset password.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <link rel="stylesheet" href="/styles.css" />
      <link rel="stylesheet" href="/auth.css" />
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="brand-mark-auth">S</div>
            <h1>Reset Password</h1>
            <p>
              {step === 1 && "Enter your email to receive an OTP"}
              {step === 2 && "Enter the OTP sent to your email and your new password"}
              {step === 3 && "Password Reset Successful"}
            </p>
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          {step === 1 && (
            <form className="auth-form" onSubmit={handleSendOtp}>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input 
                  id="email" 
                  type="email" 
                  className="input" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="maya@example.com"
                  required 
                  disabled={loading}
                />
              </div>
              
              <button type="submit" className="btn primary auth-btn" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="field">
                <label htmlFor="otp">One-Time Password (OTP)</label>
                <input 
                  id="otp" 
                  type="text" 
                  className="input" 
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="123456"
                  required 
                  disabled={loading}
                />
              </div>

              <div className="field">
                <label htmlFor="newPassword">New Password</label>
                <div className="password-input-wrapper" style={{ position: "relative" }}>
                  <input 
                    id="newPassword" 
                    type={showPassword ? "text" : "password"} 
                    className="input" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required 
                    disabled={loading}
                    style={{ width: "100%", paddingRight: "48px" }}
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <button type="submit" className="btn primary auth-btn" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              
              <button 
                type="button" 
                className="btn ghost auth-btn" 
                style={{marginTop: '10px'}} 
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back
              </button>
            </form>
          )}
          
          {step === 3 && (
            <div className="auth-success">
              <div className="success-icon">✓</div>
              <p>Your password has been reset successfully.</p>
              <Link href="/login" className="btn primary auth-btn" style={{marginTop: '20px', display: 'block', textAlign: 'center', textDecoration: 'none'}}>
                Go to Login
              </Link>
            </div>
          )}
          
          {step !== 3 && (
            <div className="auth-footer">
              Remembered your password? <Link href="/login" className="signup-link">Back to login</Link>
            </div>
          )}
        </div>
        
        <div className="auth-bg-shape shape-1"></div>
        <div className="auth-bg-shape shape-2"></div>
      </div>
    </>
  );
}
