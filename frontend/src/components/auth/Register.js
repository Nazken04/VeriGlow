import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, resendVerificationEmail, clearAuthError, clearAuthMessage } from '../../redux/actions/authActions';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import "../../styles/Register.css";

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Access loading, error, message, and new emailVerificationPending state from Redux
  const { loading, error, message, emailVerificationPending } = useSelector(state => state.auth);

  // --- Password Validation Logic (same as before) ---
  const validatePassword = (pwd) => {
    let strength = 0;
    let errors = [];

    if (pwd.length < 8) { errors.push('at least 8 characters'); } else { strength += 1; }
    if (!/[A-Z]/.test(pwd)) { errors.push('an uppercase letter'); } else { strength += 1; }
    if (!/[a-z]/.test(pwd)) { errors.push('a lowercase letter'); } else { strength += 1; }
    if (!/[0-9]/.test(pwd)) { errors.push('a number'); } else { strength += 1; }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) { errors.push('a special character'); } else { strength += 1; }

    setPasswordStrength(strength);
    if (errors.length > 0) { return `Password must contain: ${errors.join(', ')}.`; }
    return '';
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(validatePassword(newPassword));
    if (confirmPassword && newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    if (newConfirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }
  };

  const validateEmail = (emailStr) => {
    // eslint-disable-next-line no-useless-escape
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(emailStr)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError(validateEmail(newEmail));
  };

  const getPasswordStrengthColor = (strength) => {
    switch (true) {
      case strength === 0: return 'strength-none';
      case strength <= 1: return 'strength-weak';
      case strength <= 2: return 'strength-fair';
      case strength <= 3: return 'strength-good';
      case strength >= 4: return 'strength-strong';
      default: return 'strength-none';
    }
  };

  const getPasswordStrengthText = (strength) => {
    switch (true) {
      case strength === 0: return 'Type password';
      case strength <= 1: return 'Weak';
      case strength <= 2: return 'Fair';
      case strength <= 3: return 'Good';
      case strength >= 4: return 'Strong';
      default: return '';
    }
  };

  // --- Form Submission ---
  const handleRegister = async (e) => {
    e.preventDefault();

    // Clear previous messages/errors before new submission
    dispatch(clearAuthError());
    dispatch(clearAuthMessage());

    // Re-run all frontend validations on submit
    const passwordValid = validatePassword(password);
    const emailValid = validateEmail(email);
    const passwordsMatch = password === confirmPassword;

    if (passwordValid || emailValid || !passwordsMatch) {
      setPasswordError(passwordValid);
      setEmailError(emailValid);
      if (!passwordsMatch) setConfirmPasswordError('Passwords do not match.');
      return; // Prevent submission if frontend validation fails
    }

    const userData = {
      email,
      password,
      name,
      business_name: businessName,
      registration_number: registrationNumber,
      contact_number: contactNumber
    };

    await dispatch(registerUser(userData));
  };

  // NEW: Handle Resend Email
  const handleResendEmail = () => {
    if (email) {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
      dispatch(resendVerificationEmail(email));
    } else {
      toast.error("Email address is missing. Please provide it to resend.");
    }
  };

  // --- CONDITIONAL RENDERING BASED ON EMAIL VERIFICATION PENDING ---
  if (emailVerificationPending) {
    return (
      <div className="register-page-wrapper">
        <div className="register-visual-panel">
          <div className="register-intro-content">
            <h2 className="intro-welcome-text">Account Created!</h2>
            <p className="intro-description">
              Thank you for registering with VeriGlow.
              <br/><br/>
              To activate your account, please check your inbox for a verification email.
              This helps us ensure the security and authenticity of our platform.
            </p>
            <p className="intro-description-small">
              (Remember to check your spam or junk folder if you don't see it in a few minutes.)
            </p>
          </div>
        </div>
        <div className="register-form-panel register-success-panel">
          <div className="register-card">
            <span className="material-symbols-outlined checkmark-icon">check_circle</span>
            <h2 className="register-title">Verification Email Sent!</h2>
            <p className="register-subtitle">
              We've sent an email to <strong>{email}</strong>.
              <br/>
              Please click the verification link in the email to complete your registration.
            </p>
            <Link to="/login" className="login-link back-to-login-btn">Back to Login</Link>
            <p className="register-text resend-text">
              Didn't receive the email? <button type="button" className="resend-email-button" onClick={handleResendEmail} disabled={loading}>
                {loading ? 'Sending...' : 'Resend email'}
              </button>
            </p>
            {error && <p className="error-message register-error-global">Error: {error}</p>}
            {message && !error && <p className="success-message register-success-global">{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Render the registration form if not yet successful (emailVerificationPending is false)
  return (
    <div className="register-page-wrapper">
      <div className="register-visual-panel">
        <div className="register-intro-content">
          
        </div>
      </div>

      <div className="register-form-panel">
        <div className="register-card">
          <div className="logo-section">
            <img
              src="/assets/veriglow-logo.svg"
              alt="VeriGlow Logo"
              className="register-logo"
              onError={(e) => { e.target.onerror = null; e.target.src="/assets/veriglow-logo-fallback.svg"; }}
            />
            <h1 className="register-title">Create Account</h1>
            <p className="register-subtitle">Start your journey to verifiable authenticity.</p>
          </div>

          <form onSubmit={handleRegister} className="register-form">
            <div className="form-group">
              <label htmlFor="name-input" className="input-label">Full Name</label>
              <input
                type="text"
                id="name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="input-field"
                aria-label="Full Name"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email-input" className="input-label">Email address</label>
              <input
                type="email"
                id="email-input"
                value={email}
                onChange={handleEmailChange}
                required
                placeholder="user@example.com"
                className={`input-field ${emailError ? 'input-error' : ''}`}
                aria-label="Email address"
                autoComplete="email"
              />
              {emailError && <p className="error-message">{emailError}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password-input" className="input-label">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password-input"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Create your password"
                  className={`input-field ${passwordError ? 'input-error' : ''}`}
                  aria-label="Password"
                  autoComplete="new-password"
                />
                <span
                  className="material-symbols-outlined password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </div>
              <div className={`password-strength-indicator ${getPasswordStrengthColor(passwordStrength)}`}>
                <div className="strength-bar" style={{ width: `${passwordStrength * 20}%` }}></div>
                <span className="strength-text">{getPasswordStrengthText(passwordStrength)}</span>
              </div>
              {passwordError && <p className="error-message">{passwordError}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password-input" className="input-label">Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirm-password-input"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                placeholder="Re-enter your password"
                className={`input-field ${confirmPasswordError ? 'input-error' : ''}`}
                aria-label="Confirm Password"
                autoComplete="new-password"
              />
              {confirmPasswordError && <p className="error-message">{confirmPasswordError}</p>}
            </div>

            {/* NEW: Group Business Name and Registration Number in a form-row */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="business-name-input" className="input-label">Business Name</label>
                <input
                  type="text"
                  id="business-name-input"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Luxe Cosmetics Inc."
                  className="input-field"
                  aria-label="Business Name"
                  autoComplete="organization"
                />
              </div>

              <div className="form-group">
                <label htmlFor="registration-number-input" className="input-label">Registration Number(BIN)</label>
                <input
                  type="text"
                  id="registration-number-input"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g., ABC12345678"
                  className="input-field"
                  aria-label="Registration Number"
                />
              </div>
            </div>
            {/* END NEW */}

            <div className="form-group">
              <label htmlFor="contact-number-input" className="input-label">Contact Number</label>
              <input
                type="tel"
                id="contact-number-input"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g., +1 555 123 4567"
                className="input-field"
                aria-label="Contact Number"
                autoComplete="tel"
              />
            </div>

            <button type="submit" className="register-button" disabled={loading || !name || !email || !password || !confirmPassword || passwordError || confirmPasswordError || emailError}>
              {loading ? 'Registering...' : 'Register'}
            </button>
            {error && <p className="error-message register-error-global">Error: {error}</p>}
            {/* Message is shown only if not pending email verification and not an error */}
            {message && !emailVerificationPending && !error && <p className="success-message register-success-global">{message}</p>}
          </form>

          <p className="login-text">
            Already have an account? <Link to="/login" className="login-link">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;