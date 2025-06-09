import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError, clearAuthMessage, getUserProfile } from '../../redux/actions/authActions'; 
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import "../../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, message, isAuthenticated } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      toast.success('You are already logged in!');
    }
    dispatch(clearAuthError());
    dispatch(clearAuthMessage());
  }, [isAuthenticated, navigate, dispatch]); 

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(clearAuthMessage());

    try {
      await dispatch(loginUser({ email, password })); 
      await dispatch(getUserProfile()); 
      toast.success('Login successful!'); 
      navigate('/dashboard'); 
    } catch (err) {
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