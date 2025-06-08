// src/components/common/Navbar.js (No changes needed here from previous working version)
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../redux/actions/authActions';
import '../../styles/Navbar.css'; // This CSS is for the mobile menu, etc.

// Helper to debounce functions
const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};

// Hardcoded dummy data for global search simulation
const DUMMY_GLOBAL_SEARCH_DATA = [
  { id: 'prod1', type: 'Product', name: 'Eyeshadow Palette (Sparkle)', link: '/product?id=prod1' },
  { id: 'prod2', type: 'Product', name: 'Face Mask (Hydrating Collagen)', link: '/product?id=prod2' },
  { id: 'prod3', type: 'Product', name: 'Lipstick Set (Vibrant Red)', link: '/product?id=prod3' },
  { id: 'batch1', type: 'Batch', name: 'BATCH-EYE-202301', link: '/product?batch=BATCH-EYE-202301' },
  { id: 'batch2', type: 'Batch', name: 'BATCH-FM-HA-202302', link: '/product?batch=BATCH-FM-HA-202302' },
  { id: 'report1', type: 'Fraud Report', name: 'FRD-001 (Eyeshadow Report)', link: '/fraud-reports?id=FRD-001' },
  { id: 'report2', type: 'Fraud Report', name: 'FRD-002 (Face Mask Report)', link: '/fraud-reports?id=FRD-002' },
  { id: 'loc1', type: 'Location', name: 'New Arely Warehouse', link: '/fraud-reports?location=New Arely' },
  { id: 'loc2', type: 'Location', name: 'North Baby Retail Store', link: '/fraud-reports?location=North Baby' },
  { id: 'user1', type: 'User', name: 'Akniyet (admin@gmail.com)', link: '/dashboard' },
  { id: 'user2', type: 'User', name: 'Jane Doe (jane.d@example.com)', link: '/users?id=jane' },
  { id: 'setting1', type: 'Setting', name: 'User Management', link: '/settings/users' },
  { id: 'setting2', type: 'Setting', name: 'Product Categories', link: '/settings/categories' },
];

// Dummy search tips for empty search input focus
const DUMMY_SEARCH_TIPS = [
  { id: 'tip1', type: 'Search Tip', name: 'Search by Product Name (e.g., "Eyeshadow")', icon: 'inventory_2' },
  { id: 'tip2', type: 'Search Tip', name: 'Search by Batch ID (e.g., "BATCH-EYE-202301")', icon: 'widgets' },
  { id: 'tip3', type: 'Search Tip', name: 'Find Fraud Reports by Location (e.g., "New Arely")', icon: 'location_on' },
  { id: 'tip4', type: 'Search Tip', name: 'Look up specific QR/Barcode IDs', icon: 'qr_code_scanner' },
  { id: 'tip5', type: 'Search Tip', name: 'Find Users by Name or Email', icon: 'person' },
  { id: 'tip6', type: 'Search Tip', name: 'Explore Settings (e.g., "User Management")', icon: 'settings' },
];

// Simple Toast Notification component (copied from Products.js design).
const Toast = ({ message, type = 'success', show, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // Hide after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    if (!show) return null;

    let icon = '';
    switch (type) {
        case 'success': icon = 'check_circle'; break;
        case 'error': icon = 'error'; break;
        case 'info': icon = 'info'; break;
        case 'warning': icon = 'warning'; break;
        default: icon = 'notifications';
    }

    const ariaLive = type === 'success' || type === 'info' ? 'polite' : 'assertive';

    return (
        <div className={`toast show ${type}`} role="status" aria-live={ariaLive}>
            <span className="material-symbols-outlined">{icon}</span>
            {message}
        </div>
    );
};


const Navbar = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
      setToast({ show: true, message, type });
  };

  const closeToast = () => {
      setToast({ ...toast, show: false });
  };


  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  // --- Search Logic ---
  const performSearch = useCallback(debounce((term) => {
    if (term.trim() === '') {
      setSearchResults([]); // Clear results if term is empty
      return; // Do not filter if term is empty
    }

    const lowerCaseTerm = term.toLowerCase();
    const filteredResults = DUMMY_GLOBAL_SEARCH_DATA.filter(item =>
      item.name.toLowerCase().includes(lowerCaseTerm) ||
      (item.type && item.type.toLowerCase().includes(lowerCaseTerm)) ||
      (item.id && item.id.toLowerCase().includes(lowerCaseTerm))
    ).slice(0, 10); // Limit to top 10 results for display

    setSearchResults(filteredResults);
  }, 300), []); // Debounce search by 300ms

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setShowSearchResults(true); // Always show dropdown when typing
    performSearch(term); // Trigger debounced search
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false); // Hide results after clearing
    if (searchInputRef.current) {
      searchInputRef.current.focus(); // Keep focus on search bar after clearing
    }
  };

  // Handle click outside search results to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current && !searchInputRef.current.contains(event.target) &&
        searchResultsRef.current && !searchResultsRef.current.contains(event.target)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation for search results
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      searchInputRef.current.blur(); // Remove focus
    } else if (e.key === 'ArrowDown' && searchResultsRef.current) {
        e.preventDefault(); // Prevent page scroll
        const focusableItems = Array.from(searchResultsRef.current.querySelectorAll('.search-result-item, .search-tip-item'));
        const activeIndex = focusableItems.findIndex(item => item === document.activeElement);

        if (activeIndex === -1 || activeIndex === focusableItems.length - 1) {
            // If nothing is focused, or last item is focused, focus first item
            focusableItems[0]?.focus();
        } else {
            focusableItems[activeIndex + 1]?.focus();
        }
    } else if (e.key === 'ArrowUp' && searchResultsRef.current) {
        e.preventDefault(); // Prevent page scroll
        const focusableItems = Array.from(searchResultsRef.current.querySelectorAll('.search-result-item, .search-tip-item'));
        const activeIndex = focusableItems.findIndex(item => item === document.activeElement);

        if (activeIndex === 0) {
            // If first item is focused, go back to search input
            searchInputRef.current.focus();
        } else if (activeIndex > 0) {
            focusableItems[activeIndex - 1]?.focus();
        } else {
            // If nothing in dropdown is focused, focus last item
            focusableItems[focusableItems.length - 1]?.focus();
        }
    } else if (e.key === 'Enter' && document.activeElement && (document.activeElement.classList.contains('search-result-item') || document.activeElement.classList.contains('search-tip-item'))) {
        document.activeElement.click(); // Trigger click on focused item
    }
  };

  const handleSearchResultClick = (result) => {
    if (result.link) {
        navigate(result.link); // Navigate if it's a real link
    } else {
        // For search tips or non-navigable results, you might populate the search bar or show a toast
        setSearchTerm(result.name); // Populate search bar with tip name
        showToast(`Selected: "${result.name}". Now perform real search.`, 'info'); // Show info toast
    }
    setShowSearchResults(false); // Close results after action
    setSearchResults([]); // Clear results
  };

  return (
    <header className="navbar-container top-bar" role="banner">
      {/* Top Bar Search */}
      <div className="top-bar-search">
        <span className="material-symbols-outlined search-icon">search</span>
        <input
          type="search"
          placeholder="Search..."
          aria-label="Search within the application"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setShowSearchResults(true)} // Show results on focus
          onKeyDown={handleKeyDown}
          ref={searchInputRef}
        />
        {searchTerm && ( // Show clear button only if there's text
          <span
            className="material-symbols-outlined clear-search-icon"
            onClick={handleClearSearch}
            role="button"
            aria-label="Clear search"
          >
            close
          </span>
        )}

        {showSearchResults && ( // Only render dropdown if it should be shown
          <div className="top-bar-search-results" ref={searchResultsRef}>
            {searchTerm.trim() === '' ? ( // Show tips if search term is empty
              <div className="search-tips-section">
                <div className="search-tips-header">What can I search for?</div>
                {DUMMY_SEARCH_TIPS.map((tip) => (
                  <div
                    key={tip.id}
                    className="search-result-item search-tip-item" // Add search-tip-item class
                    onClick={() => handleSearchResultClick(tip)}
                    tabIndex="0" // Make selectable by keyboard
                    role="option"
                    aria-label={`Search tip: ${tip.name}`}
                  >
                    <span className="material-symbols-outlined search-result-icon">{tip.icon}</span>
                    <div className="search-result-text">
                      <div className="search-result-name">{tip.name}</div>
                      <div className="search-result-type">{tip.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : ( // Show search results if search term is not empty
              searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(result)}
                    tabIndex="0" // Make selectable by keyboard
                    role="option"
                    aria-selected={false} // Adjust based on actual selection state
                    aria-label={`Search result: ${result.name} (${result.type})`}
                  >
                    <span className={`material-symbols-outlined search-result-icon`}>{
                      result.type === 'Product' ? 'inventory_2' :
                      result.type === 'Batch' ? 'widgets' :
                      result.type === 'Fraud Report' ? 'warning' :
                      result.type === 'Location' ? 'location_on' :
                      result.type === 'User' ? 'person' :
                      result.type === 'Setting' ? 'settings' :
                      'info'
                    }</span>
                    <div className="search-result-text">
                      <div className="search-result-name">{result.name}</div>
                      <div className="search-result-type">{result.type}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-no-results">No results found for "{searchTerm}"</div>
              )
            )}
          </div>
        )}
      </div>

      {/* User Actions (Keep this section) */}
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
      <div className="toast-container">
        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast} />
      </div>
    </header>
  );
};

export default Navbar;