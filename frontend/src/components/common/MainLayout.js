// src/components/common/MainLayout.js
import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile, logoutUser } from '../../redux/actions/authActions'; // Ensure logoutUser is imported
import Navbar from './Navbar';
import Sidebar from './SideBar'; // Assuming you have this
import { toast } from 'react-toastify'; // Import toast

import '../../styles/MainLayout.css'; // Your CSS for layout styling

const MainLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading, error: authError } = useSelector(state => state.auth);

    useEffect(() => {
        const token = localStorage.getItem('token');

        // Case 1: No token, not authenticated. Redirect to login.
        if (!token && !isAuthenticated && !authLoading) {
            console.log("No token found or not authenticated. Redirecting to login.");
            navigate('/login');
            return;
        }

        // Case 2: Token exists, but Redux state not fully populated/authenticated (e.g., after refresh)
        // Only dispatch getUserProfile if user data is missing AND we are not currently loading it.
        if (token && (!user || !isAuthenticated) && !authLoading) {
            console.log("Token found, but user/auth state not loaded. Fetching profile...");
            dispatch(getUserProfile());
        }

        // Case 3: Error during auth fetch (e.g., token expired/invalid).
        // If an error exists, we're not loading, and we had a token, then it's a failed re-auth.
        if (authError && token && !authLoading) {
             console.error("Authentication error during profile fetch:", authError);
             // Clear token and logout locally to ensure clean state
             localStorage.removeItem('token');
             dispatch(logoutUser()); // This will reset auth state
             toast.error("Your session has expired or is invalid. Please log in again.");
             navigate('/login'); // Redirect to login
        }

    }, [dispatch, navigate, user, isAuthenticated, authLoading, authError]);

    // Show a global loading spinner or blank page while re-authenticating
    // This prevents content flicker/incorrect rendering before state is ready.
    if (authLoading && !user && !isAuthenticated) {
        return (
            <div className="main-layout-loading">
                <p>Loading application...</p>
                {/* You can add a fancier spinner/loader here */}
            </div>
        );
    }

    // If we reach here and are not authenticated (after loading and checks), it means
    // redirection to login should have already happened. This is a fallback/safety.
    if (!isAuthenticated) {
        return null; // Or show a simple message like "Unauthorized access"
    }

    // Render the main layout once authenticated
    return (
        <div className="main-layout">
            <Sidebar />
            <div className="main-content-area">
                <Navbar />
                <main className="page-content">
                    <Outlet /> {/* Renders the specific route component (Dashboard, etc.) */}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;