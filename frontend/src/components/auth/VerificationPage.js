import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyEmail, clearAuthError, clearAuthMessage } from '../../redux/actions/authActions';
import "../../styles/VerificationPage.css"; 

const VerificationPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(clearAuthError());
    dispatch(clearAuthMessage());

    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      dispatch(verifyEmail(token));
    } else {
      dispatch({ type: 'VERIFY_EMAIL_FAILURE', payload: 'No verification token found in URL.' });
    }
    return () => {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
    };
  }, [dispatch, location.search]);

  if (loading) {
    return (
      <div className="verification-page-wrapper">
        <div className="verification-card">
          <span className="material-symbols-outlined loading-icon">hourglass_empty</span>
          <h2 className="verification-title">Verifying your email...</h2>
          <p className="verification-subtitle">Please wait, this may take a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-page-wrapper">
      <div className="verification-card">
        {error ? (
          <>
            <span className="material-symbols-outlined error-icon">error</span>
            <h2 className="verification-title verification-error-title">Verification Failed!</h2>
            <p className="verification-subtitle verification-error-text">{error}</p>
            <p className="verification-suggestion">
              If your link expired, please go to the <Link to="/login" className="verification-link">Login Page</Link> and try logging in. If your account is not verified, you will receive a prompt to resend the verification email there.
            </p>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined success-icon">check_circle</span>
            <h2 className="verification-title">Email Verified Successfully!</h2>
            <p className="verification-subtitle">{message}</p>
            <Link to="/login" className="verification-link">Proceed to Login</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationPage;