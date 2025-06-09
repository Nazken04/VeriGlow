// src/components/common/Navbar.js
import React, { useState } from 'react'; // Removed useEffect, useRef, useCallback as they are no longer needed for search
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../redux/actions/authActions';
import '../../styles/Navbar.css'; // This CSS is for the mobile menu, etc.

// Removed debounce helper function

// Removed DUMMY_GLOBAL_SEARCH_DATA
// Removed DUMMY_SEARCH_TIPS

// Re-integrated a simplified Toast Notification component directly if it's meant to be local to Navbar
// If you have a global ToastContainer from react-toastify, you might remove this local Toast as well.
// For now, keeping it as it was defined in the provided code.
const Toast = ({ message, type = 'success', show, onClose }) => {
    // Only keep useEffect if show is a prop. If this Toast is to be removed, this useEffect also goes.
    // For now, keeping the useEffect but noting it's redundant if a global ToastContainer is used.
    // It's also likely the Toast component itself isn't needed if only used for search
    // Since the prompt was specifically about *deleting search*, I'll keep the toast functionality
    // but without any search-related calls to it.
    // If you intend to use react-toastify globally, delete this entire Toast component and its usage in Navbar.
    // The provided code already imports react-toastify in ProductRegister, which is the better approach for global toasts.
    // Let's assume this local Toast is for *only* Navbar internal messages.
    // However, given it's a simple toast and usually comes from a library,
    // it's more likely that the intention is to use react-toastify for all toasts.
    // I will remove this local Toast component and its state/functions from Navbar,
    // assuming `react-toastify` is used globally as implied by its usage in `ProductRegister`.
    return null; // Removing the local Toast component
};


const Navbar = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Removed Search state: searchTerm, searchResults, showSearchResults
  // Removed Search refs: searchInputRef, searchResultsRef

  // Removed Toast notification state: toast, setToast, showToast, closeToast
  // Assuming react-toastify is handled globally as per ProductRegister.js's usage.


  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  // Removed all Search Logic functions:
  // performSearch, handleSearchChange, handleClearSearch, useEffect for handleClickOutside,
  // handleKeyDown, handleSearchResultClick

  return (
    <header className="navbar-container top-bar" role="banner">
      {/* Removed Top Bar Search section completely */}
      {/* <div className="top-bar-search">...</div> */}

      {/* User Actions (Kept as requested) */}
      {isAuthenticated && (
        <div className="navbar-user-actions">
            <Link to="/dashboard" className="user-profile-link" aria-label="View Profile">
                 {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="User avatar" className="navbar-avatar" />
                ) : (
                    <span className="material-symbols-outlined navbar-avatar-placeholder">account_circle</span>
                )}
                <span className="user-name-desktop">{user ? user.name || user.email : 'Profile'}</span>
            </Link>
            <button onClick={handleLogout} className="logout-button" aria-label="Logout">
                <span className="material-symbols-outlined">logout</span> <span>Logout</span>
            </button>
        </div>
      )}
      {/* Removed local toast container, as it's typically handled by react-toastify's ToastContainer globally */}
      {/* <div className="toast-container">
        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast} />
      </div> */}
    </header>
  );
};

export default Navbar;