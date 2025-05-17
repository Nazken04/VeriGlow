import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile } from '../../redux/actions/authActions'; // Adjust path as needed
import '../../styles/Dashboard.css'; // Make sure this path is correct
import { FaUserCircle } from 'react-icons/fa'; 

const Dashboard = () => {
    const dispatch = useDispatch();
    const { user, loading, error } = useSelector((state) => state.auth);

    useEffect(() => {
        if (!user) { 
            dispatch(getUserProfile());
        }
    }, [dispatch, user]);

    const displayValue = (value) => value || 'N/A';

    if (loading && !user) { 
        return <div className="dashboard-status-message">Loading your profile...</div>;
    }

    if (error && !user) { 
        return <div className="dashboard-status-message error">Error loading profile: {error.message || String(error)}</div>;
    }

    if (!user) {
        return <div className="dashboard-status-message">User profile not found. Please try logging in again.</div>;
    }

    const username = displayValue(user.username || (user.email ? user.email.split('@')[0] : null));

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-header-wrapper">
                {/* The "User" and "Welcome" top bar has been removed */}
                <div className="dashboard-header-profile-section">
                    <div className="profile-avatar-container">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} alt={displayValue(user.name)} className="profile-avatar" />
                        ) : (
                            <FaUserCircle className="profile-avatar-placeholder" />
                        )}
                    </div>
                    <div className="profile-name-card">
                        <h1 className="profile-name">{displayValue(user.name)}</h1>
                        <p className="profile-email">{displayValue(user.email)}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content-area">
                <div className="profile-details-grid">
                    <div className="detail-card">
                        <span className="detail-label">Full Name</span>
                        <span className="detail-value">{displayValue(user.name)}</span>
                    </div>
                    <div className="detail-card">
                        <span className="detail-label">Email Address</span>
                        <span className="detail-value">{displayValue(user.email)}</span>
                    </div>
                    <div className="detail-card">
                        <span className="detail-label">Username</span>
                        <span className="detail-value">{username}</span>
                    </div>
                     <div className="detail-card">
                        <span className="detail-label">Contact Number</span>
                        <span className="detail-value">{displayValue(user.contact_number)}</span>
                    </div>
                    <div className="detail-card">
                        <span className="detail-label">Business Name</span>
                        <span className="detail-value">{displayValue(user.business_name)}</span>
                    </div>
                    <div className="detail-card">
                        <span className="detail-label">Registration Number</span>
                        <span className="detail-value">{displayValue(user.registration_number)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;