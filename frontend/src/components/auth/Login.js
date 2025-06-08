import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError, clearAuthMessage, getUserProfile } from '../../redux/actions/authActions'; // Import getUserProfile
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; // Ensure toast is imported
import "../../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Access loading, error, message, and isAuthenticated state from Redux
  const { loading, error, message, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    // If already authenticated (e.g., navigated back from dashboard or successful login already processed),
    // redirect to dashboard. This prevents showing the login page if already logged in.
    if (isAuthenticated) {
      navigate('/dashboard');
      toast.success('You are already logged in!');
    }
    // Clear any previous auth messages or errors when component mounts
    dispatch(clearAuthError());
    dispatch(clearAuthMessage());
  }, [isAuthenticated, navigate, dispatch]); // Depend on isAuthenticated and navigate

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(clearAuthMessage());

    try {
      await dispatch(loginUser({ email, password })); // Dispatch loginUser
      // After LOGIN_SUCCESS, state.auth.isAuthenticated becomes true.
      // The useEffect above will catch this and navigate.
      // However, to ensure full profile data is immediately available for the dashboard
      // (especially if loginUser only returns partial data), we explicitly fetch it here.
      await dispatch(getUserProfile()); // <-- IMPORTANT: Fetch full user profile
      toast.success('Login successful!'); // Toast success AFTER profile is fetched
      navigate('/dashboard'); // Navigate AFTER profile is fetched and toasted
    } catch (err) {
      // Error is already handled and toasted by authActions, no need to toast here
      console.error("Login attempt failed:", err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-visual-panel">
        <div className="intro-content">
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-card">
          <div className="logo-section">
            <img
              src="/assets/veriglow-logo.svg"
              alt="VeriGlow Logo"
              className="login-logo"
              onError={(e) => { e.target.onerror = null; e.target.src="/assets/veriglow-logo-fallback.svg"; }}
            />
            <h1 className="login-title">Sign In</h1>
            <p className="login-subtitle">Access your account to continue.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email-input" className="input-label">Email address</label>
              <input
                type="email"
                id="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
                className="input-field"
                aria-label="Email address"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password-input" className="input-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Your password"
                  className="input-field"
                  aria-label="Password"
                  autoComplete="current-password"
                />
                <span
                  className="material-symbols-outlined password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </div>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            {error && <p className="error-message">{error}</p>}
            {message && !error && <p className="success-message">{message}</p>}
          </form>

          <p className="register-text">
            Don't have an account? <Link to="/register" className="register-link">Register Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;