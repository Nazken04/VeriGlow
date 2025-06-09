
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux'; 
import { fetchFraudReports } from '../../redux/actions/fraudReportsActions'; 
import { FaSortUp, FaSortDown } from 'react-icons/fa'; 

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import "../../styles/FraudReports.css";

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

const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};


const Modal = ({ isOpen, onClose, children, title, className = '' }) => {
    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className={`modal-content ${className}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h4 id="modal-title" className="modal-title">{title}</h4>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};


const Toast = ({ message, type = 'success', show, onClose }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
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

const formatUserScanDetails = (scanHistory) => {
    if (!scanHistory || scanHistory.length === 0) {
        return { summary: 'N/A', full: 'N/A', expanded: 'N/A' };
    }
    const userIdToAliasMap = new Map();
    let aliasCounter = 0;
    const scansByAlias = {};
    scanHistory.forEach(scan => {
        const originalUserId = scan.userId;
        let userAlias;
        if (originalUserId) {
            if (!userIdToAliasMap.has(originalUserId)) {
                aliasCounter++;
                userAlias = `Scanner ${aliasCounter}`;
                userIdToAliasMap.set(originalUserId, userAlias);
            } else {
                userAlias = userIdToAliasMap.get(originalUserId);
            }
        } else {
            userAlias = "Unknown Scanner";
        }
        if (!scansByAlias[userAlias]) {
            scansByAlias[userAlias] = { locations: new Set(), count: 0 };
        }
        if (scan.location) {
            scansByAlias[userAlias].locations.add(scan.location);
        }
        scansByAlias[userAlias].count++;
    });
    const individualScannerDetails = Object.entries(scansByAlias)
        .map(([alias, data]) => {
            const locations = Array.from(data.locations);
            const locString = locations.length > 0 ? locations.join(', ') : 'No specific location';
            return `${alias} (${data.count} scan${data.count > 1 ? 's' : ''}): ${locString}`;
        });
    const fullDetailsStringForTitle = individualScannerDetails.join('; ');
    const expandedDetailsArray = Object.entries(scansByAlias)
        .map(([alias, data], index) => {
            const locations = Array.from(data.locations);
            const locString = locations.length > 0 ? locations.join(', ') : 'No specific location';
            return `${index + 1}) ${alias} (${data.count} scan${data.count > 1 ? 's' : ''}): ${locString}`;
        });
    const expandedDetailsString = expandedDetailsArray.join('\n');
    let summaryString;
    const maxScannersToShowInSummary = 1;
    const MAX_SUMMARY_LENGTH = 70;
    if (individualScannerDetails.length <= maxScannersToShowInSummary) {
        summaryString = fullDetailsStringForTitle;
    } else {
        summaryString = individualScannerDetails.slice(0, maxScannersToShowInSummary).join('; ') + ` ...(${individualScannerDetails.length - maxScannersToShowInSummary} more)`;
    }
    if (summaryString.length > MAX_SUMMARY_LENGTH) {
        summaryString = summaryString.substring(0, MAX_SUMMARY_LENGTH - 3) + "...";
    }
    return { summary: summaryString, full: fullDetailsStringForTitle, expanded: expandedDetailsString };
};

const formatReportedLocations = (locationsArray) => {
    if (!locationsArray || locationsArray.length === 0) {
        return { summary: 'None', full: 'None listed', expanded: 'None listed' };
    }
    const fullDetailsStringForTitle = locationsArray.join(', ');
    const expandedDetailsArray = locationsArray.map((loc, index) => `${index + 1}) ${loc}`);
    const expandedDetailsString = expandedDetailsArray.join('\n');
    let summaryString;
    const maxLocationsToShowInSummary = 2;
    const MAX_SUMMARY_LENGTH = 70;
    if (locationsArray.length <= maxLocationsToShowInSummary) {
        summaryString = fullDetailsStringForTitle;
    } else {
        summaryString = locationsArray.slice(0, maxLocationsToShowInSummary).join(', ') + ` ...(${locationsArray.length - maxLocationsToShowInSummary} more)`;
    }
    if (summaryString.length > MAX_SUMMARY_LENGTH) {
        summaryString = summaryString.substring(0, MAX_SUMMARY_LENGTH - 3) + "...";
    }
    return { summary: summaryString, full: fullDetailsStringForTitle, expanded: expandedDetailsString };
};


const FraudReports = () => {
  const dispatch = useDispatch(); 
  const { allReportsWithDetails, loading: reportsLoading, error: reportsError } = useSelector((state) => state.reports);

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [modalReport, setModalReport] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeDateFilter, setActiveDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const [selectedReportIds, setSelectedReportIds] = new useState(new Set());

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [copiedTextKey, setCopiedTextKey] = useState(null);

  const showToast = (message, type = 'success') => {
      setToast({ show: true, message, type });
  };

  const closeToast = () => {
      setToast({ ...toast, show: false });
  };

  const debouncedSetSearchTerm = useCallback(
    debounce((value) => {}, 300),
    []
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setActiveDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setCurrentPage(1);
    showToast('Filters cleared.', 'info');
  };

  const formatDate = (dateValue) => {
    const date = parseDateRobustly(dateValue);
    if (!date) return '-';
    return date.toLocaleDateString('en-GB');
  };

  const formatDateTime = (dateString) => {
    const date = parseDateRobustly(dateString);
    if (!date) return '-';
    return date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
  };

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
    if (diffDays <= 30 && diffDays > 0) { // Expiring soon, but not yet expired
        return { text: `Exp. in ${diffDays} days`, class: 'status-expiring-soon', isExpiringSoon: true };
    }
    return { text: 'Active', class: 'status-normal', isExpired: false, isExpiringSoon: false };
  };

  const getDateRange = (filterType, startOverride, endOverride) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    let startDate = null;
    let endDate = null;

    if (filterType === 'custom') {
        startDate = parseDateRobustly(startOverride);
        if (startDate) startDate.setHours(0,0,0,0);
        endDate = parseDateRobustly(endOverride);
        if (endDate) endDate.setHours(23,59,59,999);
    } else {
        endDate = new Date(today);
        endDate.setHours(23,59,59,999);

        let tempDate = new Date(today);
        switch (filterType) {
            case '7d': tempDate.setDate(tempDate.getDate() - 7); startDate = tempDate; break;
            case '30d': tempDate.setDate(tempDate.getDate() - 30); startDate = tempDate; break;
            case '90d': tempDate.setDate(tempDate.getDate() - 90); startDate = tempDate; break;
            case '6m': tempDate.setMonth(tempDate.getMonth() - 6); startDate = tempDate; break;
            case '1y': tempDate.setFullYear(tempDate.getFullYear() - 1); startDate = tempDate; break;
            case 'all': default: break;
        }
        if (startDate) startDate.setHours(0,0,0,0);
    }
    return { startDate, endDate };
  };

  const filteredAndSortedReports = useMemo(() => {
    let currentList = [...allReportsWithDetails]; 

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentList = currentList.filter(item => {
        const checkFields = [
          item.product_name,
          item.details?.product_name,
          item.details?.barcode,
          item.details?.product_code,
          item.batch_number,
          item.details?.batch_number,
          item.formattedLocations?.full,
          item.formattedScanActivity?.full
        ];
        return checkFields.some(field => field && String(field).toLowerCase().includes(lowerCaseSearchTerm));
      });
    }

    const { startDate, endDate } = getDateRange(activeDateFilter, customStartDate, customEndDate);
    if (startDate || endDate) {
        currentList = currentList.filter(item => {
            const detectedDate = parseDateRobustly(item.report?.detectedAt);
            if (!detectedDate) return false;

            if (startDate && detectedDate < startDate) return false;
            if (endDate && detectedDate > endDate) return false;
            return true;
        });
    }

    if (sortConfig.key !== null) {
      currentList.sort((a, b) => {
        let aValue, bValue;

        const getValue = (item, key) => {
          switch (key) {
            case 'qrBarcode': return item.details?.barcode || item.details?.product_code || item.details?._id || item.productId || '';
            case 'productName': return item.product_name || item.details?.product_name || '';
            case 'batchNumber': return item.batch_number || item.details?.batch_number || '';
            case 'manufactured': return parseDateRobustly(item.details?.manufacturing_date)?.getTime() || -Infinity;
            case 'expiry': return parseDateRobustly(item.details?.expiry_date)?.getTime() || -Infinity;
            case 'reportedScans': return item.report?.scanCount ?? -1;
            case 'detectedAt': return parseDateRobustly(item.report?.detectedAt)?.getTime() || -Infinity;
            default: return '';
          }
        };

        aValue = getValue(a, sortConfig.key);
        bValue = getValue(b, sortConfig.key);

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        } else {
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }
      });
    }
    return currentList;
  }, [allReportsWithDetails, searchTerm, activeDateFilter, customStartDate, customEndDate, sortConfig]);

  useEffect(() => {
    dispatch(fetchFraudReports()); 
  }, [dispatch]); 

  const totalPages = Math.ceil(filteredAndSortedReports.length / itemsPerPage);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedReports.slice(startIndex, endIndex);
  }, [filteredAndSortedReports, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
        direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
      if (sortConfig.key === key) {
          return (
              <span className="material-symbols-outlined sort-icon">
                  {sortConfig.direction === 'ascending' ? 'arrow_drop_up' : 'arrow_drop_down'}
              </span>
          );
      }
      return null;
  };

  const handleRowClick = (item) => {
    if (expandedRowId === item.productId) {
        setExpandedRowId(null);
    } else {
        setExpandedRowId(item.productId);
    }
    setModalReport(item);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
        const newSelected = new Set(filteredAndSortedReports.map((report) => report.productId));
        setSelectedReportIds(newSelected);
    } else {
        setSelectedReportIds(new Set());
    }
  };

  const handleCheckboxClick = (event, reportId) => {
    const newSelected = new Set(selectedReportIds);
    if (event.target.checked) {
        newSelected.add(reportId);
    } else {
        newSelected.delete(reportId);
    }
    setSelectedReportIds(newSelected);
    event.stopPropagation();
  };

  const isReportSelected = (reportId) => selectedReportIds.has(reportId);
  const areAllSelected = filteredAndSortedReports.length > 0 && selectedReportIds.size === filteredAndSortedReports.length;

  const copyToClipboard = async (text, keyIdentifier) => {
    try {
        await navigator.clipboard.writeText(text);
        setCopiedTextKey(keyIdentifier);
        setTimeout(() => setCopiedTextKey(null), 1500);
        showToast('Copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy ID.', 'error');
    }
  };

  const handleExportPDF = (reportsToExport, isBulk = false) => {
    if (reportsToExport.length === 0) {
        showToast("No data to export.", 'info');
        return;
    }
    
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text("Fraud Reports Overview", 14, 16);

    const tableColumn = [
      "QR/Barcode", "Product Name", "Batch Number", "Manufactured", "Expiry",
      "Reported Scans", "Detected At", "Reported Locations", "Scan Activity Summary" 
    ];
    const tableRows = [];

    reportsToExport.forEach(item => {
      const reportData = [
        item.details?.barcode || item.details?.product_code || item.productId || '-',
        item.product_name || item.details?.product_name || '-',
        item.batch_number || item.details?.batch_number || '-',
        item.details ? formatDate(item.details.manufacturing_date) : '-',
        item.details ? formatDate(item.details.expiry_date) : '-',
        item.report?.scanCount ?? '-',
        item.report ? formatDateTime(item.report.detectedAt) : '-',
        item.formattedLocations?.expanded || '-', 
        item.formattedScanActivity?.expanded || '-'
      ];
      tableRows.push(reportData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid', 
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' }, 
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 
        7: { cellWidth: 50 }, 
        8: { cellWidth: 60 },
      }
    });
    doc.save(`fraud_reports_${isBulk ? 'selected' : 'all'}_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast(`PDF generated successfully for ${reportsToExport.length} report(s).`, 'success');
  };

  const handleExportExcel = (reportsToExport, isBulk = false) => {
    if (reportsToExport.length === 0) {
        showToast("No data to export.", 'info');
        return;
    }

    const simplifiedData = reportsToExport.map(item => ({
      "QR/Barcode": item.details?.barcode || item.details?.product_code || item.productId || '-',
      "Product Name": item.product_name || item.details?.product_name || '-',
      "Batch Number": item.batch_number || item.details?.batch_number || '-',
      "Manufactured": item.details ? formatDate(item.details.manufacturing_date) : '-',
      "Expiry": item.details ? formatDate(item.details.expiry_date) : '-',
      "Reported Scans": item.report?.scanCount ?? '-',
      "Detected At": item.report ? formatDateTime(item.report.detectedAt) : '-',
      "Reported Locations (Full)": item.formattedLocations?.expanded || '-', 
      "Scan Activity (Full)": item.formattedScanActivity?.expanded || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(simplifiedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fraud Reports");
    
    const columnWidths = Object.keys(simplifiedData[0] || {}).map(key => {
        let maxLength = key.length;
        simplifiedData.forEach(row => {
            const cellValue = String(row[key] || "");
            const lines = cellValue.split('\n');
            const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b, "");
            maxLength = Math.max(maxLength, longestLine.length);
        });
        return { wch: Math.min(maxLength + 2, 70) }; 
    });
    worksheet['!cols'] = columnWidths;

    XLSX.writeFile(workbook, `fraud_reports_${isBulk ? 'selected' : 'all'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`Excel generated successfully for ${reportsToExport.length} report(s).`, 'success');
  };

  const handleDownloadSelectedReports = () => {
    if (selectedReportIds.size === 0) {
        showToast('Please select at least one report to download.', 'info');
        return;
    }
    const reportsToDownload = filteredAndSortedReports.filter(report => selectedReportIds.has(report.productId));
    handleExportPDF(reportsToDownload, true);
    setSelectedReportIds(new Set());
  };

  const renderSkeletonRows = () => {
    return Array(itemsPerPage).fill(0).map((_, index) => (
        <tr key={`skeleton-${index}`} className="skeleton-row">
            {Array(9).fill(0).map((_, cellIndex) => (
                <td key={`skeleton-cell-${index}-${cellIndex}`}>
                    <div className="skeleton-cell"></div>
                </td>
            ))}
        </tr>
    ));
  };

  const areFiltersActive = searchTerm !== '' || activeDateFilter !== 'all' || customStartDate !== '' || customEndDate !== '';


  return (
    <div className="fraud-reports-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Fraud Reports Overview</h1>
        </div>
        <div className="top-right-actions">
            <button
                className="secondary-button"
                onClick={() => handleExportPDF(filteredAndSortedReports)}
                disabled={filteredAndSortedReports.length === 0}
                aria-label="Export all filtered reports as PDF"
            >
                <span className="material-symbols-outlined">picture_as_pdf</span> Export PDF
            </button>
            <button
                className="secondary-button"
                onClick={() => handleExportExcel(filteredAndSortedReports)}
                disabled={filteredAndSortedReports.length === 0}
                aria-label="Export all filtered reports as Excel"
            >
                <span className="material-symbols-outlined">grid_on</span> Export Excel
            </button>
        </div>
      </div>
      <p className="page-intro-description">
        This page provides a comprehensive overview of detected counterfeit product reports. 
        You can view, search, sort, and filter report details including product information, 
        scan activity, and reported locations. Export reports for analysis.
      </p>

      <div className={`bulk-action-bar ${selectedReportIds.size > 0 ? 'visible' : ''}`}
           role="toolbar" aria-label="Bulk actions for selected reports">
          <span className="bulk-action-count">{selectedReportIds.size} items selected</span>
          <button className="bulk-action-button"
                  onClick={handleDownloadSelectedReports}
                  disabled={selectedReportIds.size === 0}
                  aria-label="Download selected reports as PDF">
              <span className="material-symbols-outlined">download</span>
              Download Selected Reports PDF
          </button>
      </div>

      <div className="filter-controls">
        <div className="search-input-group">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Search by product name, batch ID, QR/Barcode, location..."
            className="search-input"
            onChange={handleSearchChange}
            value={searchTerm}
            aria-label="Search reports"
          />
        </div>
        <div className="filter-group">
            <label htmlFor="date-filter">Detected At Date Range:</label>
            <select
                id="date-filter"
                className="filter-select"
                value={activeDateFilter}
                onChange={(e) => {
                    setActiveDateFilter(e.target.value);
                    setCurrentPage(1);
                }}
                aria-label="Filter by detected at date range"
            >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
                <option value="custom">Custom Range</option>
            </select>
        </div>

        {activeDateFilter === 'custom' && (
            <>
                <div className="filter-group">
                    <label htmlFor="start-date-filter">From:</label>
                    <input
                        type="date"
                        id="start-date-filter"
                        className="filter-input"
                        value={customStartDate}
                        onChange={(e) => {
                            setCustomStartDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        aria-label="Custom start date"
                    />
                </div>
                <div className="filter-group">
                    <label htmlFor="end-date-filter">To:</label>
                    <input
                        type="date"
                        id="end-date-filter"
                        className="filter-input"
                        value={customEndDate}
                        onChange={(e) => {
                            setCustomEndDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        aria-label="Custom end date"
                    />
                </div>
            </>
        )}
      </div>

      {areFiltersActive && (
          <div className="filter-chips-container" aria-live="polite" aria-atomic="true">
              <span className="filter-chips-label">Active Filters:</span>
              {searchTerm && (
                  <span className="filter-chip">
                      Search: "{searchTerm}"
                      <button onClick={() => setSearchTerm('')} aria-label="Clear search filter">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </span>
              )}
              {activeDateFilter !== 'all' && (
                  <span className="filter-chip">
                      Detected At: {
                          activeDateFilter === '7d' ? 'Last 7 Days' :
                          activeDateFilter === '30d' ? 'Last 30 Days' :
                          activeDateFilter === '90d' ? 'Last 90 Days' :
                          activeDateFilter === '6m' ? 'Last 6 Months' :
                          activeDateFilter === '1y' ? 'Last Year' :
                          `Custom (${formatDate(customStartDate)} - ${formatDate(customEndDate)})`
                      }
                      <button onClick={() => { setActiveDateFilter('all'); setCustomStartDate(''); setCustomEndDate(''); }} aria-label="Clear date filter">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </span>
              )}
              <button className="clear-all-filters" onClick={handleClearAllFilters} aria-label="Clear all active filters">
                  Clear All
              </button>
          </div>
      )}

      {reportsLoading && ( // Use reportsLoading from Redux
          <div className="table-container">
              <table className="reports-table">
                  <thead>
                      <tr>
                          <th style={{ width: '40px', cursor: 'default' }} className="checkbox-cell"><input type="checkbox" disabled /></th>
                          <th>Image</th>
                          <th>QR/Barcode</th>
                          <th>Product Name</th>
                          <th>Batch Number</th>
                          <th>Manufactured</th>
                          <th>Expiry</th>
                          <th>Reported Scans</th>
                          <th>Detected At</th>
                          <th>Reported Locations</th>
                          <th>Scan Activity Summary</th>
                      </tr>
                  </thead>
                  <tbody>
                      {renderSkeletonRows()}
                  </tbody>
              </table>
          </div>
      )}

      {!reportsLoading && reportsError && <p className="error-text">{reportsError}</p>} {/* Use reportsError from Redux */}

      {!reportsLoading && !reportsError && filteredAndSortedReports.length === 0 && (
          <div className="no-data-view">
              <span className="material-symbols-outlined no-data-icon">inbox</span>
              <h3 className="no-data-title">
                  {areFiltersActive ? "No fraud reports found matching your filters." : "No fraud reports available yet."}
              </h3>
              <p className="no-data-description">
                  {areFiltersActive ? "Try adjusting your filters or clear them to see all reports." : "There are currently no fraud reports in the system."}
              </p>
              {areFiltersActive && (
                  <button className="primary-button" onClick={handleClearAllFilters}>
                      Clear Filters
                  </button>
              )}
          </div>
      )}

      {!reportsLoading && !reportsError && filteredAndSortedReports.length > 0 && (
          <div className="table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', cursor: 'default' }} className="checkbox-cell">
                    <input
                      type="checkbox"
                      onChange={handleSelectAllClick}
                      checked={areAllSelected}
                      aria-label="Select all reports"
                    />
                  </th>
                  <th data-label-header="Image">Image</th>
                  <th onClick={() => requestSort('qrBarcode')} data-label-header="QR/Barcode" aria-sort={sortConfig.key === 'qrBarcode' ? sortConfig.direction : 'none'}>QR/Barcode {getSortIndicator('qrBarcode')}</th>
                  <th onClick={() => requestSort('productName')} data-label-header="Product Name" aria-sort={sortConfig.key === 'productName' ? sortConfig.direction : 'none'}>Product Name {getSortIndicator('productName')}</th>
                  <th onClick={() => requestSort('batchNumber')} data-label-header="Batch Number" aria-sort={sortConfig.key === 'batchNumber' ? sortConfig.direction : 'none'}>Batch Number {getSortIndicator('batchNumber')}</th>
                  <th onClick={() => requestSort('manufactured')} data-label-header="Manufactured" aria-sort={sortConfig.key === 'manufactured' ? sortConfig.direction : 'none'}>Manufactured {getSortIndicator('manufactured')}</th>
                  <th onClick={() => requestSort('expiry')} data-label-header="Expiry" aria-sort={sortConfig.key === 'expiry' ? sortConfig.direction : 'none'}>Expiry {getSortIndicator('expiry')}</th>
                  <th onClick={() => requestSort('reportedScans')} data-label-header="Reported Scans" aria-sort={sortConfig.key === 'reportedScans' ? sortConfig.direction : 'none'}>Reported Scans {getSortIndicator('reportedScans')}</th>
                  <th onClick={() => requestSort('detectedAt')} data-label-header="Detected At" aria-sort={sortConfig.key === 'detectedAt' ? sortConfig.direction : 'none'}>Detected At {getSortIndicator('detectedAt')}</th>
                  <th data-label-header="Reported Locations">Reported Locations</th>
                  <th data-label-header="Scan Activity Summary">Scan Activity Summary</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map((item) => {
                  const expiryStatus = getExpiryStatus(item.details?.expiry_date);
                  const qrBarcodeId = item.details?.barcode || item.details?.product_code || item.details?._id || item.productId || 'N/A';
                  return (
                    <tr 
                        key={item.productId} 
                        onClick={() => handleRowClick(item)}
                        role="button" tabIndex="0" aria-label={`View details for report ${qrBarcodeId}`}
                    >
                      <td style={{ cursor: 'default' }} className="checkbox-cell">
                          <input
                              type="checkbox"
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleCheckboxClick(e, item.productId)}
                              checked={isReportSelected(item.productId)}
                              aria-label={`Select report ${qrBarcodeId}`}
                          />
                      </td>
                      <td data-label-header="Image" className="image-cell">
                        {item.details?.image_url ? (
                           <img 
                            src={item.details.image_url}
                            alt={item.product_name || 'Product'} 
                            className="product-image"
                            loading="lazy"
                            onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/64x64?text=No+Img"; }}
                          />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </td>
                      <td data-label-header="QR/Barcode" className="detail-with-copy-icon">
                          <span onClick={(e) => e.stopPropagation()}>{qrBarcodeId}</span>
                          <span
                              className="material-symbols-outlined copy-icon"
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(qrBarcodeId, `table-qr-${item.productId}`); }}
                              aria-label={`Copy QR/Barcode ID ${qrBarcodeId} to clipboard`}
                          >
                              content_copy
                          </span>
                          {copiedTextKey === `table-qr-${item.productId}` && <span className="copied-tooltip">Copied!</span>}
                      </td>
                      <td data-label-header="Product Name">
                        <span className="product-name-text">
                            {item.product_name || (item.details?.product_name) || '-'}
                        </span>
                      </td>
                      <td data-label-header="Batch Number" className="detail-with-copy-icon">
                          <span onClick={(e) => e.stopPropagation()}>{item.batch_number || (item.details?.batch_number) || '-'}</span>
                          <span
                              className="material-symbols-outlined copy-icon"
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(item.batch_number || (item.details?.batch_number), `table-batch-${item.productId}`); }}
                              aria-label={`Copy Batch Number ${item.batch_number || (item.details?.batch_number)} to clipboard`}
                          >
                              content_copy
                          </span>
                          {copiedTextKey === `table-batch-${item.productId}` && <span className="copied-tooltip">Copied!</span>}
                      </td>
                      <td data-label-header="Manufactured">{item.details ? formatDate(item.details.manufacturing_date) : (item.detailsError || '-')}</td>
                      <td data-label-header="Expiry" className={`expires-cell ${expiryStatus?.class}`} title={expiryStatus?.isExpired ? 'This batch has expired.' : ''}>
                        {item.details ? formatDate(item.details.expiry_date) : (item.detailsError || '-')}
                        {expiryStatus?.isExpired && (
                            <span className="material-symbols-outlined expiry-info-icon">cancel</span>
                        )}
                      </td>
                      <td data-label-header="Reported Scans">{item.report?.scanCount ?? '-'}</td>
                      <td data-label-header="Detected At">{item.report ? formatDateTime(item.report.detectedAt) : '-'}</td>
                      <td 
                        data-label-header="Reported Locations" 
                        title={item.formattedLocations?.full || (item.detailsError || '-')}
                        className="cell-reported-locations"
                      >
                        <pre className="expandable-content">
                            {expandedRowId === item.productId 
                                ? (item.formattedLocations?.expanded || (item.detailsError || '-'))
                                : (item.formattedLocations?.summary || (item.detailsError || '-'))
                            }
                        </pre>
                      </td>
                      <td 
                        data-label-header="Scan Activity Summary"
                        title={item.formattedScanActivity?.full || (item.detailsError || '-')}
                        className="cell-scan-activity"
                      >
                         <pre className="expandable-content">
                            {expandedRowId === item.productId 
                                ? (item.formattedScanActivity?.expanded || (item.detailsError || '-'))
                                : (item.formattedScanActivity?.summary || (item.detailsError || '-'))
                            }
                        </pre>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      )}

      {/* Pagination Controls */}
      {!reportsLoading && !reportsError && filteredAndSortedReports.length > 0 && (
          <div className="pagination">
              <span className="total-items-count">Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedReports.length)}  of {filteredAndSortedReports.length} reports</span>
              <select
                  className="rows-per-page-selector"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  aria-label="Number of rows per page"
              >
                  <option value={5}>Show 5</option>
                  <option value={10}>Show 10</option>
                  <option value={25}>Show 25</option>
                  <option value={50}>Show 50</option>
              </select>
              {totalPages > 1 && (
                  <div className="page-controls">
                      <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          className="page-btn"
                          disabled={currentPage === 1}
                          aria-label="Go to previous page"
                      >
                          <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      {[...Array(totalPages).keys()].map(x => (
                          <button
                              key={x}
                              onClick={() => handlePageChange(x + 1)}
                              className={x + 1 === currentPage ? 'page-btn active' : 'page-btn'}
                              aria-current={x + 1 === currentPage ? 'page' : undefined}
                              aria-label={`Go to page ${x + 1}`}
                          >
                              {x + 1}
                          </button>
                      ))}
                      <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          className="page-btn"
                          disabled={currentPage === totalPages}
                          aria-label="Go to next page"
                      >
                          <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Report Details Modal */}
      <Modal isOpen={!!modalReport} onClose={() => setModalReport(null)} title="Report Details">
          {modalReport && (
              <div className="modal-details-grid">
                  <div className="modal-detail-row">
                      <strong className="modal-detail-label">QR/Barcode:</strong>
                      <span className="modal-detail-value">{modalReport.details?.barcode || modalReport.details?.product_code || modalReport.productId || '-'}</span>
                      <span
                          className="material-symbols-outlined copy-icon"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(modalReport.details?.barcode || modalReport.details?.product_code || modalReport.productId, 'modal-qr'); }}
                          aria-label={`Copy QR/Barcode ID ${modalReport.details?.barcode || modalReport.details?.product_code || modalReport.productId} to clipboard`}
                      >
                          content_copy
                      </span>
                      {copiedTextKey === 'modal-qr' && <span className="copied-tooltip">Copied!</span>}
                  </div>
                  <div className="modal-detail-row">
                      <strong className="modal-detail-label">Product Name:</strong>
                      <span className="modal-detail-value">{modalReport.product_name || modalReport.details?.product_name || '-'}</span>
                      <span
                          className="material-symbols-outlined copy-icon"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(modalReport.product_name || modalReport.details?.product_name, 'modal-product-name'); }}
                          aria-label={`Copy Product Name ${modalReport.product_name || modalReport.details?.product_name} to clipboard`}
                      >
                          content_copy
                      </span>
                      {copiedTextKey === 'modal-product-name' && <span className="copied-tooltip">Copied!</span>}
                  </div>
                  <div className="modal-detail-row">
                      <strong className="modal-detail-label">Batch Number:</strong>
                      <span className="modal-detail-value">{modalReport.batch_number || modalReport.details?.batch_number || '-'}</span>
                      <span
                          className="material-symbols-outlined copy-icon"
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(modalReport.batch_number || modalReport.details?.batch_number, 'modal-batch-number'); }}
                          aria-label={`Copy Batch Number ${modalReport.batch_number || modalReport.details?.batch_number} to clipboard`}
                      >
                          content_copy
                      </span>
                      {copiedTextKey === 'modal-batch-number' && <span className="copied-tooltip">Copied!</span>}
                  </div>
                  <div className="modal-detail-row">
                      <strong className="modal-detail-label">Manufactured Date:</strong>
                      <span className="modal-detail-value">{formatDate(modalReport.details?.manufacturing_date)}</span>
                  </div>
                  <div className="modal-detail-row">
                      <strong className="modal-detail-label">Expiry Date:</strong>
                      <span className={`modal-detail-value ${getExpiryStatus(modalReport.details?.expiry_date)?.class}`}>
                        {formatDate(modalReport.details?.expiry_date)}
                        {getExpiryStatus(modalReport.details?.expiry_date)?.isExpired && (
                            <span className="material-symbols-outlined expiry-info-icon">cancel</span>
                        )}
                      </span>
                  </div>
                  <div className="modal-detail-row">
                      <strong className="modal-detail-label">Reported Scans:</strong>
                      <span className="modal-detail-value">{modalReport.report?.scanCount ?? '-'}</span>
                  </div>
                  <div className="modal-detail-row">
                      <strong className="modal-detail-label">Detected At:</strong>
                      <span className="modal-detail-value">{formatDateTime(modalReport.report?.detectedAt)}</span>
                  </div>

                  {(modalReport.formattedLocations?.expanded && modalReport.formattedLocations.expanded !== 'N/A') && (
                    <div className="modal-detail-row modal-detail-block">
                        <strong className="modal-detail-label">Reported Locations:</strong>
                        <pre className="modal-detail-list">{modalReport.formattedLocations.expanded}</pre>
                    </div>
                  )}
                  {(modalReport.formattedScanActivity?.expanded && modalReport.formattedScanActivity.expanded !== 'N/A') && (
                    <div className="modal-detail-row modal-detail-block">
                        <strong className="modal-detail-label">Scan Activity:</strong>
                        <pre className="modal-detail-list">{modalReport.formattedScanActivity.expanded}</pre>
                    </div>
                  )}

                  {modalReport.details?.ingredients && (
                      <div className="modal-detail-row">
                          <strong className="modal-detail-label">Ingredients:</strong>
                          <span className="modal-detail-value">{modalReport.details.ingredients}</span>
                          <span
                            className="material-symbols-outlined copy-icon"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(modalReport.details.ingredients, 'modal-ingredients'); }}
                            aria-label={`Copy Ingredients to clipboard`}
                          >
                              content_copy
                          </span>
                          {copiedTextKey === 'modal-ingredients' && <span className="copied-tooltip">Copied!</span>}
                      </div>
                  )}
                  {modalReport.details?.description && (
                      <div className="modal-detail-row modal-detail-block">
                          <strong className="modal-detail-label">Description:</strong>
                          <pre className="modal-detail-list">{modalReport.details.description}</pre>
                          <span
                            className="material-symbols-outlined copy-icon"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(modalReport.details.description, 'modal-description'); }}
                            aria-label={`Copy Description to clipboard`}
                          >
                              content_copy
                          </span>
                          {copiedTextKey === 'modal-description' && <span className="copied-tooltip">Copied!</span>}
                      </div>
                  )}
                  {modalReport.details?.gtin && (
                      <div className="modal-detail-row">
                          <strong className="modal-detail-label">GTIN:</strong>
                          <span className="modal-detail-value">{modalReport.details.gtin}</span>
                           <span
                            className="material-symbols-outlined copy-icon"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(modalReport.details.gtin, 'modal-gtin'); }}
                            aria-label={`Copy GTIN to clipboard`}
                          >
                              content_copy
                          </span>
                          {copiedTextKey === 'modal-gtin' && <span className="copied-tooltip">Copied!</span>}
                      </div>
                  )}
              </div>
          )}
      </Modal>

      <div className="toast-container">
          <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast} />
      </div>
    </div>
  );
};

export default FraudReports;