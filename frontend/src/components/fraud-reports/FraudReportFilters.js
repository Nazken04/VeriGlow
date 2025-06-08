import React, { useState, useEffect, useId, useRef } from 'react';
import { FaCalendarAlt, FaDownload } from 'react-icons/fa'; // Added FaDownload icon
import { toast } from 'react-toastify'; // Keep toast for feedback

import '../../styles/FraudReports.css'; // Shared CSS for this page

const DATE_FILTER_TYPE = 'Detected At';

const DATE_RANGE_OPTIONS = [
  { label: 'All Time', value: 'all' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last Year', value: '1y' },
  { label: 'Custom Range', value: 'custom' },
];

const FraudReportFilters = ({ onFilterChange, initialFilters, onExportPDF, onExportExcel, hasData }) => {
  const [localFilters, setLocalFilters] = useState({
    searchTerm: '',
    dateRange: 'all',
    startDate: '',
    endDate: '',
  });
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false); // New state for download dropdown

  const isInitialMount = useRef(true); // Use useRef for initialMount check

  const searchId = useId();
  const dateRangeId = useId();
  const startDateId = useId();
  const endDateId = useId();

  // Sync internal state with external initialFilters on initial mount or significant external change
  useEffect(() => {
    if (isInitialMount.current) {
        // Only set initial filters if they are provided, otherwise use default empty state
        setLocalFilters(initialFilters && Object.keys(initialFilters).length > 0
            ? initialFilters
            : { searchTerm: '', dateRange: 'all', startDate: '', endDate: '' });
        isInitialMount.current = false;
    } else {
        // Prevent endless loops if initialFilters is updated frequently but internally
        // Deep comparison for objects might be needed for complex initialFilters,
        // but JSON.stringify is often good enough for simple objects.
        const currentLocalFiltersString = JSON.stringify(localFilters);
        const incomingInitialFiltersString = JSON.stringify(initialFilters || {});
        if (currentLocalFiltersString !== incomingInitialFiltersString) {
            setLocalFilters(initialFilters || {});
        }
    }
  }, [initialFilters]); // Depend on initialFilters prop

  // Handle predefined date range selection logic
  useEffect(() => {
    if (localFilters.dateRange === 'custom') return; // Do nothing if custom range is active

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for accurate comparison

    let calculatedStartDate = '';
    let calculatedEndDate = '';

    // Calculate end date for predefined ranges to be today (inclusive)
    calculatedEndDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

    const tempDate = new Date(today); // Use a temporary date object for calculations
    switch (localFilters.dateRange) {
      case '7d':
        tempDate.setDate(tempDate.getDate() - 7);
        calculatedStartDate = tempDate.toISOString().split('T')[0];
        break;
      case '30d':
        tempDate.setDate(tempDate.getDate() - 30);
        calculatedStartDate = tempDate.toISOString().split('T')[0];
        break;
      case '90d':
        tempDate.setDate(tempDate.getDate() - 90);
        calculatedStartDate = tempDate.toISOString().split('T')[0];
        break;
      case '6m':
        tempDate.setMonth(tempDate.getMonth() - 6);
        calculatedStartDate = tempDate.toISOString().split('T')[0];
        break;
      case '1y':
        tempDate.setFullYear(tempDate.getFullYear() - 1);
        calculatedStartDate = tempDate.toISOString().split('T')[0];
        break;
      case 'all': // "All Time" means no specific date filters
      default:
        calculatedStartDate = '';
        calculatedEndDate = '';
        break;
    }

    // Only update if the calculated dates are different to prevent unnecessary re-renders
    if (localFilters.startDate !== calculatedStartDate || localFilters.endDate !== calculatedEndDate) {
      setLocalFilters(prev => ({
        ...prev,
        startDate: calculatedStartDate,
        endDate: calculatedEndDate,
      }));
    }
  }, [localFilters.dateRange, localFilters.startDate, localFilters.endDate]); // Depend on relevant filter parts

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setLocalFilters(prev => {
        const newState = { ...prev, [name]: value };
        // If user manually changes start/end date, set dateRange to 'custom' unless it's already 'custom'
        if ((name === 'startDate' || name === 'endDate') && prev.dateRange !== 'custom') {
            newState.dateRange = 'custom';
        }
        return newState;
    });
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { searchTerm: '', dateRange: 'all', startDate: '', endDate: '' };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
    toast.info('Filters cleared.', { autoClose: 1500, className: 'toast-info-custom' });
  };

  // Close download dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('.export-buttons') === null) {
        setShowDownloadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDownloadPDFClick = () => {
    onExportPDF();
    setShowDownloadDropdown(false);
  };

  const handleDownloadExcelClick = () => {
    onExportExcel();
    setShowDownloadDropdown(false);
  };

  return (
    <div className="filter-card">
      <div className="filter-card-header">
        <h3>Filter Batches</h3> {/* Keeping "Filter Batches" as it's the section title */}
      </div>
      
      <form className="filter-form" onSubmit={handleApplyFilters}>
        <div className="filter-inputs-grid">
          <div className="filter-group filter-group-search">
            <label htmlFor={searchId} className="filter-label"> 
              Search (Product Name, Batch ID, QR/Barcode, Location):
            </label>
            <input
              type="text"
              id={searchId}
              name="searchTerm"
              placeholder="e.g., Eyeshadow, BATCH123, SC2023..."
              value={localFilters.searchTerm}
              onChange={handleChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group filter-group-date-range-select">
            <label htmlFor={dateRangeId} className="filter-label">{DATE_FILTER_TYPE} Date Range:</label>
            <div className="custom-select-wrapper">
                <select
                    id={dateRangeId}
                    name="dateRange"
                    value={localFilters.dateRange}
                    onChange={handleChange}
                    className="filter-input custom-select"
                >
                    {DATE_RANGE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <span className="select-arrow"></span>
            </div>
          </div>

          {localFilters.dateRange === 'custom' && (
            <>
                <div className="filter-group">
                    <label htmlFor={startDateId} className="filter-label">
                        {DATE_FILTER_TYPE} From:
                    </label>
                    <div className="date-input-wrapper">
                        <input
                            type="date"
                            id={startDateId}
                            name="startDate"
                            value={localFilters.startDate}
                            onChange={handleChange}
                            className="filter-input"
                        />
                        <FaCalendarAlt className="calendar-icon" />
                    </div>
                </div>

                <div className="filter-group">
                    <label htmlFor={endDateId} className="filter-label">
                        {DATE_FILTER_TYPE} To:
                    </label>
                    <div className="date-input-wrapper">
                        <input
                            type="date"
                            id={endDateId}
                            name="endDate"
                            value={localFilters.endDate}
                            onChange={handleChange}
                            className="filter-input"
                        />
                        <FaCalendarAlt className="calendar-icon" />
                    </div>
                </div>
            </>
          )}
        </div>
        
        <div className="filter-actions">
            <div className="filter-buttons">
                <button
                    type="submit"
                    className="primary-button filter-apply-btn"
                >
                    Apply Filters
                </button>
                <button
                    type="button"
                    onClick={handleClearFilters}
                    className="secondary-button filter-clear-btn"
                >
                    Clear Filters
                </button>
            </div>
            
            <div className="export-buttons">
                <button
                    type="button"
                    onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                    className="secondary-button export-btn"
                    disabled={!hasData}
                >
                    <FaDownload className="icon-left" /> Download 
                </button>
                {showDownloadDropdown && (
                    <div className="download-dropdown">
                        <button 
                            type="button" 
                            onClick={handleDownloadPDFClick}
                            className="dropdown-item"
                        >
                            Export PDF
                        </button>
                        <button 
                            type="button" 
                            onClick={handleDownloadExcelClick}
                            className="dropdown-item"
                        >
                            Export Excel
                        </button>
                    </div>
                )}
            </div>
        </div>
      </form>
    </div>
  );
};

export default FraudReportFilters;