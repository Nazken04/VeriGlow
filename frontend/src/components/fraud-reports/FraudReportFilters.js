import React, { useState, useEffect, useId, useRef } from 'react';
import { FaCalendarAlt, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

import '../../styles/FraudReports.css';

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
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  const isInitialMount = useRef(true);

  const searchId = useId();
  const dateRangeId = useId();
  const startDateId = useId();
  const endDateId = useId();

  useEffect(() => {
    if (isInitialMount.current) {
        setLocalFilters(initialFilters && Object.keys(initialFilters).length > 0
            ? initialFilters
            : { searchTerm: '', dateRange: 'all', startDate: '', endDate: '' });
        isInitialMount.current = false;
    } else {
        const currentLocalFiltersString = JSON.stringify(localFilters);
        const incomingInitialFiltersString = JSON.stringify(initialFilters || {});
        if (currentLocalFiltersString !== incomingInitialFiltersString) {
            setLocalFilters(initialFilters || {});
        }
    }
  }, [initialFilters]);

  useEffect(() => {
    if (localFilters.dateRange === 'custom') return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let calculatedStartDate = '';
    let calculatedEndDate = '';

    calculatedEndDate = today.toISOString().split('T')[0];

    const tempDate = new Date(today);
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
      case 'all':
      default:
        calculatedStartDate = '';
        calculatedEndDate = '';
        break;
    }

    if (localFilters.startDate !== calculatedStartDate || localFilters.endDate !== calculatedEndDate) {
      setLocalFilters(prev => ({
        ...prev,
        startDate: calculatedStartDate,
        endDate: calculatedEndDate,
      }));
    }
  }, [localFilters.dateRange, localFilters.startDate, localFilters.endDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setLocalFilters(prev => {
        const newState = { ...prev, [name]: value };
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
        <h3>Filter Batches</h3>
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