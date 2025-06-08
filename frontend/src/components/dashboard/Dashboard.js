// src/components/dashboard/Dashboard.js
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserProfile } from '../../redux/actions/authActions';
import { fetchManufacturerProducts } from '../../redux/actions/productActions';
// Import the NEWLY CREATED fetchFraudReports action
import { fetchFraudReports } from '../../redux/actions/fraudReportsActions'; 

import '../../styles/Dashboard.css';

// Helper to parse dates robustly (copied from previous iterations)
const parseDateRobustly = (dateValue) => {
    if (!dateValue) return null;
    if (Number.isFinite(dateValue)) {
        return new Date(dateValue > 30000000000 ? dateValue : dateValue * 1000);
    }
    const dotParts = String(dateValue).split('.');
    if (dotParts.length === 3) {
        const date = new Date(parseInt(dotParts[2], 10), parseInt(dotParts[1], 10) - 1, parseInt(dotParts[0], 10));
        if (!isNaN(date.getTime())) return date;
    }
    const slashParts = String(dateValue).split('/');
    if (slashParts.length === 3) {
        const date = new Date(parseInt(slashParts[2], 10), parseInt(slashParts[1], 10) - 1, parseInt(slashParts[0], 10));
        if (!isNaN(date.getTime())) return date;
    }
    const fallbackDate = new Date(dateValue);
    return !isNaN(fallbackDate.getTime()) ? fallbackDate : null;
};

// Helper to format dates (copied from previous iterations)
const formatDate = (dateValue) => {
    const date = parseDateRobustly(dateValue);
    if (!date) return '-';
    return date.toLocaleDateString('en-GB');
};

// Helper to get expiry status (copied from previous iterations)
const getExpiryStatus = (expiryDateString) => {
    const expiryDate = parseDateRobustly(expiryDateString);
    if (!expiryDate) return null;
    expiryDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      return { text: 'Expired', class: 'status-expired', isExpired: true };
    }
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30 && diffDays > 0) { // expiring soon within 30 days
        return { text: `Exp. in ${diffDays} days`, class: 'status-expiring-soon', isExpiringSoon: true };
    }
    return { text: 'Active', class: 'status-normal', isExpired: false, isExpiringSoon: false };
};


const Dashboard = () => {
    const dispatch = useDispatch();
    // Select user profile
    const { user, loading: userLoading, error: userError } = useSelector((state) => state.auth);
    // Select product batches (from product slice, assuming it has 'batches' array)
    const { batches, loading: productsLoading, error: productsError } = useSelector((state) => state.product);
    // Select fraud reports from the NEW 'reports' slice
    const { allReportsWithDetails, loading: reportsLoading, error: reportsError } = useSelector((state) => state.reports);

    const [copiedKey, setCopiedKey] = useState(null);

    // Fetch all necessary data on component mount
    useEffect(() => {
        if (!user) { 
            dispatch(getUserProfile());
        }
        dispatch(fetchManufacturerProducts()); // Ensure product data is loaded
        dispatch(fetchFraudReports()); // Dispatch the new fraud reports action
    }, [dispatch, user]);

    const displayValue = (value) => value || '-';

    const copyToClipboard = async (text, key) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 1500);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const username = displayValue(user?.username || (user?.email ? user.email.split('@')[0] : null));

    // --- Analytics Calculations (Memoized for performance) ---
    const analytics = useMemo(() => {
        // Only calculate if both batches and allReportsWithDetails are available and not loading
        if (productsLoading || reportsLoading || !batches || !allReportsWithDetails) {
            return null; 
        }

        const uniqueProducts = new Set();
        let totalItems = 0;
        let productsExpiringSoonCount = 0;
        let expiredProductsCount = 0;

        batches.forEach(batch => {
            if (batch.product_name) {
                uniqueProducts.add(batch.product_name);
            }
            if (batch.count) {
                totalItems += batch.count;
            }
            const expiryStatus = getExpiryStatus(batch.expiry_date);
            if (expiryStatus?.isExpired) {
                expiredProductsCount++;
            } else if (expiryStatus?.isExpiringSoon) {
                productsExpiringSoonCount++;
            }
        });

        const totalScans = allReportsWithDetails.reduce((sum, report) => sum + (report.report?.scanCount || 0), 0);
        const totalFraudReports = allReportsWithDetails.length;

        // Get recently registered products (last 5)
        const recentlyRegistered = [...batches]
            .sort((a, b) => {
                const dateA = parseDateRobustly(a.manufacturing_date)?.getTime() || 0;
                const dateB = parseDateRobustly(b.manufacturing_date)?.getTime() || 0;
                return dateB - dateA; // Sort descending by manufacturing date
            })
            .slice(0, 5); // Get top 5 recent

        return {
            totalProductsRegistered: uniqueProducts.size,
            totalBatchesRegistered: batches.length,
            totalIndividualItems: totalItems,
            totalScans,
            totalFraudReports,
            productsExpiringSoonCount,
            expiredProductsCount,
            recentlyRegistered,
        };
    }, [batches, allReportsWithDetails, productsLoading, reportsLoading]); // Recalculate when data or loading states change

    const isLoading = userLoading || productsLoading || reportsLoading;
    const hasError = userError || productsError || reportsError;

    if (isLoading && (!user || !analytics)) { // Show loading state until user and analytics are loaded
        return (
            <div className="dashboard-page-container">
                <div className="dashboard-status-message loading">Loading your profile and analytics...</div>
            </div>
        );
    }

    if (hasError) { // Show error if any API call failed
        return (
            <div className="dashboard-page-container">
                <div className="dashboard-status-message error">Error loading data: {userError?.message || productsError?.message || reportsError?.message || 'An unexpected error occurred.'}</div>
            </div>
        );
    }

    if (!user) { // If user profile is not loaded even after trying
        return (
            <div className="dashboard-page-container">
                <div className="dashboard-status-message no-data">User profile not found. Please try logging in again.</div>
            </div>
        );
    }
    
    // If analytics is still null after data is loaded (e.g., if batches/reports are empty arrays initially)
    // or if a calculation dependency is missing (should be caught by useMemo dependencies now)
    if (!analytics) { // This case should ideally not be hit if data is loaded and empty array handled by useMemo
        return (
             <div className="dashboard-page-container">
                <div className="dashboard-status-message loading">Calculating analytics...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-page-container">
            <div className="dashboard-header-wrapper">
                <div className="dashboard-header-profile-section">
                    <div className="profile-avatar-container">
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt={displayValue(user.name)} className="profile-avatar" />
                        ) : (
                            <span className="material-symbols-outlined profile-avatar-placeholder">account_circle</span>
                        )}
                    </div>
                    <div className="profile-name-card">
                        <h1 className="profile-name">{displayValue(user.name)}</h1>
                        <p className="profile-email">{displayValue(user.email)}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content-area">
                {/* Analytics Overview Section */}
                <h2 className="section-title">Analytics Overview</h2>
                <div className="analytics-grid">
                    <div className="analytics-card">
                        <span className="material-symbols-outlined analytics-icon">category</span>
                        <div className="analytics-info">
                            <span className="analytics-value">{analytics.totalProductsRegistered}</span>
                            <span className="analytics-label">Total Unique Products</span>
                        </div>
                    </div>
                    <div className="analytics-card">
                        <span className="material-symbols-outlined analytics-icon">widgets</span>
                        <div className="analytics-info">
                            <span className="analytics-value">{analytics.totalBatchesRegistered}</span>
                            <span className="analytics-label">Total Batches Registered</span>
                        </div>
                    </div>
                    <div className="analytics-card">
                        <span className="material-symbols-outlined analytics-icon">dns</span>
                        <div className="analytics-info">
                            <span className="analytics-value">{new Intl.NumberFormat().format(analytics.totalIndividualItems)}</span>
                            <span className="analytics-label">Total Individual Items</span>
                        </div>
                    </div>
                    <div className="analytics-card">
                        <span className="material-symbols-outlined analytics-icon">qr_code_scanner</span>
                        <div className="analytics-info">
                            <span className="analytics-value">{new Intl.NumberFormat().format(analytics.totalScans)}</span>
                            <span className="analytics-label">Total Scans Recorded</span>
                        </div>
                    </div>
                    <div className="analytics-card">
                        <span className="material-symbols-outlined analytics-icon warning-icon">report</span>
                        <div className="analytics-info">
                            <span className="analytics-value">{analytics.totalFraudReports}</span>
                            <span className="analytics-label">Total Fraud Reports</span>
                        </div>
                    </div>
                    <div className="analytics-card analytics-card-expiry">
                        <span className="material-symbols-outlined analytics-icon expiry-icon">event_busy</span>
                        <div className="analytics-info">
                            <span className="analytics-value">{analytics.expiredProductsCount}</span>
                            <span className="analytics-label">Expired Products</span>
                        </div>
                        <span className="material-symbols-outlined analytics-icon expiring-soon-icon">timelapse</span>
                        <div className="analytics-info">
                            <span className="analytics-value">{analytics.productsExpiringSoonCount}</span>
                            <span className="analytics-label">Expiring Soon</span>
                        </div>
                    </div>
                </div>

                {/* Recently Registered Products */}
                <h2 className="section-title">Recently Registered Products</h2>
                <div className="recently-registered-card">
                    {analytics.recentlyRegistered.length > 0 ? (
                        <ul>
                            {analytics.recentlyRegistered.map(batch => (
                                <li key={batch.batch_number} className="recent-item">
                                    <div className="recent-item-info">
                                        <span className="recent-item-name">{batch.product_name || '-'}</span>
                                        <span className="recent-item-batch">{batch.batch_number || '-'}</span>
                                    </div>
                                    <div className="recent-item-meta">
                                        <span className="recent-item-date">{formatDate(batch.manufacturing_date)}</span>
                                        <span className={`recent-item-expiry ${getExpiryStatus(batch.expiry_date)?.class}`}>
                                            {formatDate(batch.expiry_date)}
                                            {getExpiryStatus(batch.expiry_date)?.isExpired && (
                                                <span className="material-symbols-outlined expiry-info-icon">cancel</span>
                                            )}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="no-recent-activity">
                            <span className="material-symbols-outlined">info</span>
                            <span>No recent product registrations.</span>
                        </div>
                    )}
                </div>

                {/* User Profile Details Section */}
                <h2 className="section-title">Profile Details</h2>
                <div className="profile-details-grid">
                    {/* Full Name */}
                    <div className="detail-card">
                        <span className="detail-label">Full Name</span>
                        <div className="detail-value-wrapper">
                            <span className="detail-value">{displayValue(user.name)}</span>
                            <span 
                                className="material-symbols-outlined copy-icon" 
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(displayValue(user.name), 'fullName'); }}
                                title="Copy Full Name"
                            >
                                content_copy
                            </span>
                            {copiedKey === 'fullName' && <span className="copied-tooltip">Copied!</span>}
                        </div>
                    </div>
                    {/* Email Address */}
                    <div className="detail-card">
                        <span className="detail-label">Email Address</span>
                        <div className="detail-value-wrapper">
                            <span className="detail-value">{displayValue(user.email)}</span>
                            <span 
                                className="material-symbols-outlined copy-icon" 
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(displayValue(user.email), 'email'); }}
                                title="Copy Email Address"
                            >
                                content_copy
                            </span>
                            {copiedKey === 'email' && <span className="copied-tooltip">Copied!</span>}
                        </div>
                    </div>
                    {/* Username */}
                    <div className="detail-card">
                        <span className="detail-label">Username</span>
                        <div className="detail-value-wrapper">
                            <span className="detail-value">{username}</span>
                            <span 
                                className="material-symbols-outlined copy-icon" 
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(username, 'username'); }}
                                title="Copy Username"
                            >
                                content_copy
                            </span>
                            {copiedKey === 'username' && <span className="copied-tooltip">Copied!</span>}
                        </div>
                    </div>
                    {/* Contact Number */}
                     <div className="detail-card">
                        <span className="detail-label">Contact Number</span>
                        <div className="detail-value-wrapper">
                            <span className="detail-value">{displayValue(user.contact_number)}</span>
                            <span 
                                className="material-symbols-outlined copy-icon" 
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(displayValue(user.contact_number), 'contactNumber'); }}
                                title="Copy Contact Number"
                            >
                                content_copy
                            </span>
                            {copiedKey === 'contactNumber' && <span className="copied-tooltip">Copied!</span>}
                        </div>
                    </div>
                    {/* Business Name */}
                    <div className="detail-card">
                        <span className="detail-label">Business Name</span>
                        <div className="detail-value-wrapper">
                            <span className="detail-value">{displayValue(user.business_name)}</span>
                            <span 
                                className="material-symbols-outlined copy-icon" 
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(displayValue(user.business_name), 'businessName'); }}
                                title="Copy Business Name"
                            >
                                content_copy
                            </span>
                            {copiedKey === 'businessName' && <span className="copied-tooltip">Copied!</span>}
                        </div>
                    </div>
                    {/* Registration Number */}
                    <div className="detail-card">
                        <span className="detail-label">Registration Number</span>
                        <div className="detail-value-wrapper">
                            <span className="detail-value">{displayValue(user.registration_number)}</span>
                            <span 
                                className="material-symbols-outlined copy-icon" 
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(displayValue(user.registration_number), 'registrationNumber'); }}
                                title="Copy Registration Number"
                            >
                                content_copy
                            </span>
                            {copiedKey === 'registrationNumber' && <span className="copied-tooltip">Copied!</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;