import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { registerUser } from '../../redux/actions/authActions';
import { useNavigate } from 'react-router-dom';
import "../../styles/Register.css"
const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const userData = {
      email,
      password,
      name,
      business_name: businessName,
      registration_number: registrationNumber,
      contact_number: contactNumber
    };

    dispatch(registerUser(userData, navigate));
  };

  return (
    <div className="register-container">
      <div className="info-section">
        <h2>Welcome to VeriGlow</h2>
        <p>
          Register to gain access to exclusive manufacturer tools, product tracking,
          and verification.
        </p>
        <p>
          <strong>Tip:</strong> Make  sure your email and registration details as registration number are accurate!
          
        </p>
      </div>

      <div className="form-section">
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div>
            <label>Name:</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label>Email:</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label>Password:</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div>
            <label>Confirm Password:</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          <div>
            <label>Business Name (Optional):</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>

          <div>
            <label>Registration Number (Optional):</label>
            <input type="text" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
          </div>

          <div>
            <label>Contact Number (Optional):</label>
            <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
          </div>

          <button type="submit">Register</button>
        </form>

        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
