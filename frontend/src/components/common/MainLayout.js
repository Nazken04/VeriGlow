import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile, logoutUser } from '../../redux/actions/authActions'; 
import Navbar from './Navbar';
import Sidebar from './SideBar'; 
import { toast } from 'react-toastify'; 

import '../../styles/MainLayout.css'; 

const MainLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated, loading: authLoading, error: authError } = useSelector(state => state.auth);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token && !isAuthenticated && !authLoading) {
            console.log("No token found or not authenticated. Redirecting to login.");
            navigate('/login');
            return;
        }

        if (token && (!user || !isAuthenticated) && !authLoading) {
            console.log("Token found, but user/auth state not loaded. Fetching profile...");
            dispatch(getUserProfile());
        }

        if (authError && token && !authLoading) {
             console.error("Authentication error during profile fetch:", authError);
             localStorage.removeItem('token');
             dispatch(logoutUser());
             toast.error("Your session has expired or is invalid. Please log in again.");
             navigate('/login'); 
        }

    }, [dispatch, navigate, user, isAuthenticated, authLoading, authError]);

    if (authLoading && !user && !isAuthenticated) {
        return (
            <div className="main-layout-loading">
                <p>Loading application...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; 
    }

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