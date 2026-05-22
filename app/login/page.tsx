"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Store the token and user data
        if (data.data?.token) {
          localStorage.setItem("token", data.data.token);
        }
        if (data.data?.user) {
          localStorage.setItem("user", JSON.stringify(data.data.user));
        }
        
        // Redirect to the scheduler dashboard after login
        window.location.href = "/";
      } else {
        setError(data.message || "Invalid email or password");
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
            <h1>Welcome Back</h1>
            <p>Log in to your social media scheduler</p>
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit}>
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
            
            <div className="field">
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
              </div>
              <div className="password-input-wrapper" style={{ position: "relative" }}>
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  className="input" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
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
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
        
        {/* Background decorative elements */}
        <div className="auth-bg-shape shape-1"></div>
        <div className="auth-bg-shape shape-2"></div>
      </div>
    </>
  );
}
