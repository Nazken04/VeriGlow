import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { forgotPassword } from '../../redux/actions/authActions'; // Action to handle password reset

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();

  const handleForgotPassword = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email)); // Dispatch password reset action
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleForgotPassword}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Reset Password</button>
      </form>
      <p>
        Remembered your password? <a href="/login">Login</a>
      </p>
    </div>
  );
};

export default ForgotPassword;
