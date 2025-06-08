import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import {
    fetchManufacturerProducts,
    fetchProductsByBatchAPI
} from '../../redux/actions/productActions'; // Adjust this path as per your project structure
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // For generating tables in PDF

import "../../styles/Products.css"; // Ensure this path is correct for your project

/**
 * A simple debounce utility function to limit how often a function is called.
 * Useful for search inputs to prevent excessive re-renders or API calls.
 * @param {function} func The function to debounce.
 * @param {number} delay The delay in milliseconds.
 * @returns {function} The debounced function.
 */
const debounce = (func, delay) => {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};

/**
 * Reusable Modal component.
 */
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

/**
 * Simple Toast Notification component.
 */
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


/**
 * ManufacturerProducts Component
 * Displays an overview of manufacturing batches.
 */
const ManufacturerProducts = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate(); // Initialize useNavigate
    const { batches, loading, error, page, pages } = useSelector((state) => state.product);

    // --- Local States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [modalBatch, setModalBatch] = useState(null); // For batch details modal

    const [selectedBatchIds, setSelectedBatchIds] = useState(new Set()); // For bulk actions
    const [rowsPerPage, setRowsPerPage] = useState(10); // State for rows per page
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' }); // For toast notifications
    const [copiedBatchId, setCopiedBatchId] = useState(null); // For copy-to-clipboard feedback

    // New state for date filtering
    const [activeDateFilter, setActiveDateFilter] = useState('all'); // 'all', 'last30', 'last90', 'last180', 'last365'

    // --- Effects ---
    useEffect(() => {
        // Assume fetchManufacturerProducts supports rowsPerPage and page for server-side pagination
        dispatch(fetchManufacturerProducts(page || 1, rowsPerPage));
    }, [dispatch, page, rowsPerPage]);

    // Debounced search term update
    const debouncedSetSearchTerm = useCallback(
        debounce((value) => {
            setSearchTerm(value);
        }, 300),
        []
    );

    const handleSearchChange = (e) => {
        // Controlled component: update local state immediately for input value
        setSearchTerm(e.target.value);
        // Then debounce for actual filtering logic
        debouncedSetSearchTerm(e.target.value);
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
    };

    const closeToast = () => {
        setToast({ ...toast, show: false });
    };

    const handleClearAllFilters = () => {
        setSearchTerm(''); // Clear the input value
        setActiveDateFilter('all');
        // If debounced search term needs to be explicitly cleared for immediate filter update:
        // debouncedSetSearchTerm(''); // This might be needed if the debounce isn't linked to the controlled input directly for clearing.
                                     // In this setup, setting searchTerm to '' will trigger re-memoization of filteredAndSortedBatches.
    };


    // --- Sorting Logic ---
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending'; // Cycle between asc/desc
        }
        setSortConfig({ key, direction });
    };

    // ONLY shows sort direction icon when a column is actively sorted, matching the design.
    const getSortIndicator = (key) => {
        if (sortConfig.key === key) {
            return (
                <span className="material-symbols-outlined sort-icon">
                    {sortConfig.direction === 'ascending' ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
            );
        }
        return null; // No icon for unsorted columns as per design
    };


    // --- Date Filtering Logic ---
    const getDateRange = (filterType) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        let startDate = null;
        let endDate = today;

        switch (filterType) {
            case 'last30':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 30);
                break;
            case 'last90':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 90);
                break;
            case 'last180': // Last 6 months
                startDate = new Date(today);
                startDate.setDate(today.getDate() - 180);
                break;
            case 'last365': // Last year
                startDate = new Date(today);
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            case 'all':
            default:
                break; // No date filter applied
        }
        return { startDate, endDate };
    };


    // --- Filtering & Sorting Memoization ---
    const filteredAndSortedBatches = useMemo(() => {
        let sortableBatches = [...batches]; // Start with a copy of the original batches

        // 1. Apply Search Filter
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            sortableBatches = sortableBatches.filter(batch =>
                (batch.product_name && batch.product_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (batch.batch_number && batch.batch_number.toString().toLowerCase().includes(lowerCaseSearchTerm)) ||
                (batch.ingredients && batch.ingredients.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        // 2. Apply Date Filter (based on manufacturing_date)
        const { startDate, endDate } = getDateRange(activeDateFilter);
        if (startDate) {
            sortableBatches = sortableBatches.filter(batch => {
                // Ensure manufacturing_date is parsed correctly, handling potential Unix timestamps
                const manufDate = new Date(Number(batch.manufacturing_date) < 1000000000000 ? Number(batch.manufacturing_date) * 1000 : batch.manufacturing_date); // Corrected to check for milliseconds
                manufDate.setHours(0, 0, 0, 0); // Normalize to start of day
                return manufDate >= startDate && manufDate <= endDate;
            });
        }

        // 3. Apply Sorting
        if (sortConfig.key !== null) {
            sortableBatches.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'count') {
                    aValue = Number(aValue);
                    bValue = Number(bValue);
                } else if (sortConfig.key === 'manufacturing_date' || sortConfig.key === 'expiry_date') {
                    // Convert to milliseconds if it looks like a Unix timestamp (seconds)
                    aValue = new Date(Number(aValue) < 1000000000000 ? Number(aValue) * 1000 : aValue).getTime();
                    bValue = new Date(Number(bValue) < 1000000000000 ? Number(bValue) * 1000 : bValue).getTime();
                } else {
                    aValue = String(aValue || '').toLowerCase();
                    bValue = String(bValue || '').toLowerCase();
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableBatches;
    }, [batches, searchTerm, sortConfig, activeDateFilter]);

    // --- Date Formatting & Expiry Status (Revised to match strict red if expired) ---
    const formatDate = (dateValue) => {
        if (!dateValue) return '-';
        try {
            // Convert to milliseconds if it looks like a Unix timestamp (seconds)
            const date = new Date(Number(dateValue) < 1000000000000 ? Number(dateValue) * 1000 : dateValue); // Corrected to check for milliseconds
            if (isNaN(date.getTime())) {
                return '-'; // Still invalid after conversion attempts
            }
            return date.toLocaleDateString('en-GB'); // Uses DD/MM/YYYY format
        } catch (e) {
            console.error("Error formatting date:", dateValue, e);
            return '-';
        }
    };

    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return { text: 'N/A', class: 'status-normal', daysLeft: null };
        const today = new Date();
        // Convert to milliseconds if it looks like a Unix timestamp (seconds)
        const expiry = new Date(Number(expiryDate) < 1000000000000 ? Number(expiryDate) * 1000 : expiryDate); // Corrected to check for milliseconds
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: 'Expired', class: 'status-expired', daysLeft: diffDays };
        } else {
            // Only 'expired' gets special styling (red text, icon)
            return { text: `Expires in ${diffDays} days`, class: 'status-normal', daysLeft: diffDays };
        }
    };

    // --- Copy to Clipboard ---
    const copyToClipboard = async (text, batchId) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedBatchId(batchId); // Show "Copied!" for this batch ID
            setTimeout(() => setCopiedBatchId(null), 1500); // Hide after 1.5 seconds
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy Batch ID.', 'error');
        }
    };

    // --- Individual PDF Generation Logic (Download Codes) ---
    const downloadCodesPDF = async (batchSummary) => {
        setIsPdfLoading(true);
        try {
            const result = await fetchProductsByBatchAPI(batchSummary.batch_number);

            if (!result.success || !result.data || result.data.length === 0) {
                showToast(result.error || `No individual products found for batch ${batchSummary.batch_number}.`, 'error');
                return;
            }

            const individualProducts = result.data;
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            let yPosition = 20;
            const leftMargin = 15;
            const itemHeight = 60; // Space per item including codes and text

            // Batch Summary Header
            pdf.setFontSize(18);
            pdf.text('Batch Product Codes', leftMargin, yPosition);
            yPosition += 10;
            pdf.setFontSize(12);
            pdf.text(`Product: ${batchSummary.product_name || 'N/A'}`, leftMargin, yPosition);
            yPosition += 7;
            pdf.text(`Batch ID: ${batchSummary.batch_number}`, leftMargin, yPosition);
            yPosition += 7;
            pdf.text(`Quantity: ${individualProducts.length} pcs`, leftMargin, yPosition);
            yPosition += 7;
            pdf.text(`Manufactured: ${formatDate(batchSummary.manufacturing_date)}`, leftMargin, yPosition);
            yPosition += 7;
            pdf.text(`Expires: ${formatDate(batchSummary.expiry_date)}`, leftMargin, yPosition);
            yPosition += 15;

            individualProducts.forEach((currentProduct, i) => {
                // Add new page if content will overflow
                if (yPosition + itemHeight > (pdf.internal.pageSize.height - 20)) {
                    pdf.addPage();
                    yPosition = 20;
                }

                const barcodeX = leftMargin;
                const barcodeY = yPosition;
                const barcodeWidth = 80;
                const barcodeHeight = 25;

                // Barcode image
                if (currentProduct.barcode_image && currentProduct.barcode_image.startsWith('data:image')) {
                    try {
                        const imgData = currentProduct.barcode_image;
                        const imgFormat = imgData.match(/data:image\/([a-zA-Z+]+);base64/)?.[1].toUpperCase() || 'PNG';
                        pdf.addImage(imgData, imgFormat, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
                    } catch (e) {
                        pdf.setFontSize(8).text("Error loading barcode", barcodeX, barcodeY + barcodeHeight / 2);
                        console.warn(`Failed to add barcode image for item ${currentProduct.product_id}:`, e);
                    }
                } else {
                    pdf.setFontSize(8).text("No Barcode Image", barcodeX + barcodeWidth / 2, barcodeY + barcodeHeight / 2, { align: 'center' });
                }

                // QR Code image
                const qrCodeX = barcodeX + barcodeWidth + 10;
                const qrCodeY = yPosition;
                const qrCodeSize = 25;
                if (currentProduct.qr_code_image && currentProduct.qr_code_image.startsWith('data:image')) {
                    try {
                        const imgData = currentProduct.qr_code_image;
                        const imgFormat = imgData.match(/data:image\/([a-zA-Z+]+);base64/)?.[1].toUpperCase() || 'PNG';
                        pdf.addImage(imgData, imgFormat, qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
                    } catch (e) {
                        pdf.setFontSize(8).text("Error loading QR", qrCodeX, qrCodeY + qrCodeSize / 2);
                        console.warn(`Failed to add QR image for item ${currentProduct.product_id}:`, e);
                    }
                } else {
                    pdf.setFontSize(8).text("No QR Image", qrCodeX + qrCodeSize / 2, qrCodeY + qrCodeSize / 2, { align: 'center' });
                }

                // Textual details below codes - Removed Product ID as requested
                const textDetailY = yPosition + Math.max(barcodeHeight, qrCodeSize) + 5;
                pdf.setFontSize(10);
                // pdf.text(`Product ID: ${currentProduct.product_id || 'N/A'}`, leftMargin, textDetailY); // REMOVED AS REQUESTED
                pdf.text(`Item Code: ${currentProduct.barcode || 'N/A'}`, leftMargin, textDetailY); // Adjusted Y position
                
                yPosition += itemHeight; // Move to the next item's starting position
            });

            pdf.save(`Batch_Codes_${batchSummary.batch_number}.pdf`);
            showToast(`PDF generated successfully for batch ${batchSummary.batch_number}.`);

        } catch (err) {
            console.error('Error generating PDF:', err);
            showToast('Failed to generate PDF. Please try again.', 'error');
        } finally {
            setIsPdfLoading(false);
        }
    };

    // --- Bulk PDF Download (for selected batches - Summary) ---
    const handleDownloadSelectedPdfs = async () => {
        if (selectedBatchIds.size === 0) {
            showToast('Please select at least one batch to download.', 'error');
            return;
        }

        setIsPdfLoading(true);
        let successCount = 0;
        let failCount = 0;

        // Convert Set to Array to iterate reliably
        const batchesToDownload = Array.from(selectedBatchIds).map(id =>
            batches.find(b => b.batch_number === id)
        ).filter(Boolean); // Filter out any null/undefined if batch not found

        // Create a single consolidated PDF for all selected batches
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        let yPosition = 20;
        const leftMargin = 15;
        const pageHeight = pdf.internal.pageSize.height;
        const sectionHeight = 80; // Height per batch section

        pdf.setFontSize(22);
        pdf.text('Selected Batches Product Codes Summary', leftMargin, yPosition);
        yPosition += 15;

        for (const batch of batchesToDownload) {
            // Add new page if content will overflow
            if (yPosition + sectionHeight > (pageHeight - 20) && batch !== batchesToDownload[0]) { // Don't add page for first batch if it fits
                pdf.addPage();
                yPosition = 20;
                pdf.setFontSize(18); // Header for new page
                pdf.text('Selected Batches Product Codes Summary (Cont.)', leftMargin, yPosition);
                yPosition += 15;
            }

            try {
                const result = await fetchProductsByBatchAPI(batch.batch_number);
                if (result.success && result.data && result.data.length > 0) {
                    pdf.setFontSize(14);
                    // Added more batch information as requested ("add all information" interpreted as comprehensive batch details)
                    pdf.text(`Batch ID: ${batch.batch_number}`, leftMargin, yPosition);
                    yPosition += 6;
                    pdf.text(`Product Name: ${batch.product_name || 'N/A'}`, leftMargin, yPosition);
                    yPosition += 6;
                    pdf.text(`Quantity: ${result.data.length} pcs`, leftMargin, yPosition);
                    yPosition += 6;
                    pdf.text(`Manufactured Date: ${formatDate(batch.manufacturing_date)}`, leftMargin, yPosition);
                    yPosition += 6;
                    pdf.text(`Expiry Date: ${formatDate(batch.expiry_date)}`, leftMargin, yPosition);
                    yPosition += 6;
                    pdf.text(`Ingredients: ${batch.ingredients ? (batch.ingredients.length > 70 ? `${batch.ingredients.substring(0, 67)}...` : batch.ingredients) : '-'}`, leftMargin, yPosition);
                    if (batch.description) {
                        yPosition += 6;
                        pdf.text(`Description: ${batch.description ? (batch.description.length > 70 ? `${batch.description.substring(0, 67)}...` : batch.description) : '-'}`, leftMargin, yPosition);
                    }
                    if (batch.gtin) {
                        yPosition += 6;
                        pdf.text(`GTIN: ${batch.gtin}`, leftMargin, yPosition);
                    }
                    yPosition += 8; // Space before listing individual codes

                    pdf.setFontSize(10);
                    pdf.text('Example Product Codes:', leftMargin, yPosition);
                    yPosition += 5;

                    // Max 3 individual product codes shown per batch in summary
                    const productsToDisplay = result.data.slice(0, 3);
                    productsToDisplay.forEach((prod, idx) => {
                        // Removed (ID: ${prod.product_id || 'N/A'}) as requested
                        pdf.text(`  Code ${idx + 1}: ${prod.barcode || 'N/A'}`, leftMargin, yPosition);
                        yPosition += 5;
                    });
                    if (result.data.length > 3) {
                        pdf.text(`  ... and ${result.data.length - 3} more items.`, leftMargin, yPosition);
                        yPosition += 5;
                    }
                    pdf.line(leftMargin, yPosition, pdf.internal.pageSize.width - leftMargin, yPosition); // Separator
                    yPosition += 7;
                    successCount++;
                } else {
                    failCount++;
                    pdf.setFontSize(12).text(`Batch ID: ${batch.batch_number} - No individual products found or API error.`, leftMargin, yPosition);
                    yPosition += 10;
                    pdf.line(leftMargin, yPosition, pdf.internal.pageSize.width - leftMargin, yPosition); // Separator
                    yPosition += 7;
                    console.warn(`Skipping PDF for batch ${batch.batch_number}: No products found or API error.`);
                }
            } catch (err) {
                failCount++;
                pdf.setFontSize(12).text(`Batch ID: ${batch.batch_number} - Error fetching data.`, leftMargin, yPosition);
                yPosition += 10;
                pdf.line(leftMargin, yPosition, pdf.internal.pageSize.width - leftMargin, yPosition); // Separator
                yPosition += 7;
                console.error(`Error generating PDF for batch ${batch.batch_number}:`, err);
            }
        }
        pdf.save(`Selected_Batches_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);

        setIsPdfLoading(false);
        setSelectedBatchIds(new Set()); // Clear selection after action

        if (successCount > 0 && failCount === 0) {
            showToast(`Successfully generated summary PDF for ${successCount} batch(es).`);
        } else if (successCount > 0 && failCount > 0) {
            showToast(`Generated summary PDF for ${successCount} batch(es). Failed for ${failCount}.`, 'warning');
        } else {
            showToast('No summary PDF generated.', 'error');
        }
    };


    // --- Bulk Actions Checkbox Logic ---
    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            const newSelected = new Set(filteredAndSortedBatches.map((batch) => batch.batch_number));
            setSelectedBatchIds(newSelected);
        } else {
            setSelectedBatchIds(new Set());
        }
    };

    const handleCheckboxClick = (event, batchId) => {
        const newSelected = new Set(selectedBatchIds);
        if (event.target.checked) {
            newSelected.add(batchId);
        } else {
            newSelected.delete(batchId);
        }
        setSelectedBatchIds(newSelected);
    };

    const isBatchSelected = (batchId) => selectedBatchIds.has(batchId);
    const areAllSelected = filteredAndSortedBatches.length > 0 && selectedBatchIds.size === filteredAndSortedBatches.length;

    // --- Rows per Page & Pagination ---
    const handleRowsPerPageChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        // Reset to first page when rows per page changes
        dispatch(fetchManufacturerProducts(1, Number(e.target.value)));
    };

    // Render skeleton rows while loading
    const renderSkeletonRows = () => {
        // 8 columns + 1 for checkbox = 9 columns
        return Array(rowsPerPage).fill(0).map((_, index) => (
            <tr key={`skeleton-${index}`} className="skeleton-row">
                {Array(9).fill(0).map((_, cellIndex) => (
                    <td key={`skeleton-cell-${index}-${cellIndex}`}>
                        <div className="skeleton-cell"></div>
                    </td>
                ))}
            </tr>
        ));
    };

    // Determine if any filters are active
    const areFiltersActive = searchTerm !== '' || activeDateFilter !== 'all';

    return (
        <div className="manufacturer-products-container">
            {/* Global Page Header */}
            <div className="page-header">
                <div className="page-title-group">
                    <h1 className="page-title">Batch Overview</h1>
                    <span className="info-tooltip-icon" aria-label="More information about Batch Overview">
                        <span className="material-symbols-outlined">info</span>
                        <span className="info-tooltip-content">
                            This page provides a comprehensive list of all manufactured product batches.
                            You can view details, download associated codes, and manage batches.
                        </span>
                    </span>
                </div>
                {/* Add New Batch button (top right) - redirects */}
                <button className="primary-button" onClick={() => navigate('/product-register')}>
                    <span className="material-symbols-outlined">add</span>
                    Add New Batch
                </button>
            </div>
            <p className="page-intro-description">
                This page provides a comprehensive overview of your manufacturing batches. You can view, search, sort, and filter batch details including product information, manufacturing and expiry dates, and ingredients. Download unique product codes for each batch for traceability and authenticity.
            </p>

            {/* Bulk Action Bar - Visible only when items are selected */}
            <div className={`bulk-action-bar ${selectedBatchIds.size > 0 ? 'visible' : ''}`}
                 role="toolbar" aria-label="Bulk actions for selected batches">
                <span className="bulk-action-count">{selectedBatchIds.size} items selected</span>
                <button className="bulk-action-button"
                        onClick={handleDownloadSelectedPdfs}
                        disabled={isPdfLoading}
                        aria-label={isPdfLoading ? "Generating PDFs..." : "Download selected batch PDFs"}>
                    <span className="material-symbols-outlined">download</span>
                    {isPdfLoading ? 'Generating...' : 'Download Selected Batch Summary PDF'}
                </button>
            </div>

            {/* Filter and Search Controls */}
            <div className="filter-controls">
                <div className="search-input-group">
                    <span className="material-symbols-outlined">search</span>
                    <input
                        type="text"
                        placeholder="Search by product name, batch ID, or ingredients..."
                        className="search-input"
                        onChange={handleSearchChange}
                        value={searchTerm} // Controlled component for clearing filter chip
                        aria-label="Search batches"
                    />
                </div>
                {/* Date Filter Dropdown */}
                <div className="filter-group">
                    <label htmlFor="date-filter">Manufactured Date:</label>
                    <select
                        id="date-filter"
                        className="filter-select"
                        value={activeDateFilter}
                        onChange={(e) => setActiveDateFilter(e.target.value)}
                        aria-label="Filter by manufacturing date range"
                    >
                        <option value="all">All Time</option>
                        <option value="last30">Last 30 Days</option>
                        <option value="last90">Last 90 Days</option>
                        <option value="last180">Last 6 Months</option>
                        <option value="last365">Last Year</option>
                    </select>
                </div>

                {/* General "Filters" button - REMOVED AS REQUESTED */}
                {/* <button className="filter-button" onClick={() => showToast('Filters functionality under development. (Mock)', 'info')} aria-label="Open filter options">
                    <span className="material-symbols-outlined">filter_alt</span>
                    Filters
                </button> */}
            </div>

            {/* Active Filter Chips */}
            {(searchTerm || activeDateFilter !== 'all') && (
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
                            Manufactured: {
                                activeDateFilter === 'last30' ? 'Last 30 Days' :
                                activeDateFilter === 'last90' ? 'Last 90 Days' :
                                activeDateFilter === 'last180' ? 'Last 6 Months' :
                                activeDateFilter === 'last365' ? 'Last Year' : 'Custom'
                            }
                            <button onClick={() => setActiveDateFilter('all')} aria-label="Clear date filter">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </span>
                    )}
                    <button className="clear-all-filters" onClick={handleClearAllFilters} aria-label="Clear all active filters">
                        Clear All
                    </button>
                </div>
            )}


            {/* Conditional Loading, Error, and Empty States */}
            {loading && (
                <div className="table-container">
                    <table className="batches-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" disabled /></th>
                                <th>Image</th>
                                <th>Product Name</th>
                                <th>Batch ID</th>
                                <th>Quantity</th>
                                <th>Manufactured</th>
                                <th>Expires</th>
                                <th>Ingredients</th>
                                <th>Download Codes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderSkeletonRows()}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && error && <p className="error-text">{error}</p>}

            {!loading && !error && filteredAndSortedBatches.length === 0 && (
                <div className="no-data-view">
                    <span className="material-symbols-outlined no-data-icon">inbox</span>
                    <h3 className="no-data-title">
                        {areFiltersActive ? "No batches found matching your filters." : "No batches available yet."}
                    </h3>
                    <p className="no-data-description">
                        {areFiltersActive ? "Try adjusting your filters or clear them to see all batches." : "It looks like you haven't added any batches. Start by creating your first batch!"}
                    </p>
                    {areFiltersActive ? (
                        <button className="primary-button" onClick={handleClearAllFilters}>
                            Clear Filters
                        </button>
                    ) : (
                        <button className="primary-button" onClick={() => navigate('/product-register')}>
                            <span className="material-symbols-outlined">add</span>
                            Add Your First Batch
                        </button>
                    )}
                </div>
            )}

            {/* Batches Table - Only render if data exists and not loading */}
            {!loading && !error && filteredAndSortedBatches.length > 0 && (
                <div className="table-container">
                    <table className="batches-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px', cursor: 'default' }} className="checkbox-cell">
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAllClick}
                                        checked={areAllSelected}
                                        aria-label="Select all batches"
                                    />
                                </th>
                                <th onClick={() => requestSort('image_url')} data-label-header="Image" aria-sort={sortConfig.key === 'image_url' ? sortConfig.direction : 'none'}>Image {getSortIndicator('image_url')}</th>
                                <th onClick={() => requestSort('product_name')} data-label-header="Product Name" aria-sort={sortConfig.key === 'product_name' ? sortConfig.direction : 'none'}>Product Name {getSortIndicator('product_name')}</th>
                                <th onClick={() => requestSort('batch_number')} data-label-header="Batch ID" aria-sort={sortConfig.key === 'batch_number' ? sortConfig.direction : 'none'}>Batch ID {getSortIndicator('batch_number')}</th>
                                <th onClick={() => requestSort('count')} data-label-header="Quantity" aria-sort={sortConfig.key === 'count' ? sortConfig.direction : 'none'}>Quantity {getSortIndicator('count')}</th>
                                <th onClick={() => requestSort('manufacturing_date')} data-label-header="Manufactured" aria-sort={sortConfig.key === 'manufacturing_date' ? sortConfig.direction : 'none'}>Manufactured {getSortIndicator('manufacturing_date')}</th>
                                <th onClick={() => requestSort('expiry_date')} data-label-header="Expires" aria-sort={sortConfig.key === 'expiry_date' ? sortConfig.direction : 'none'}>Expires {getSortIndicator('expiry_date')}</th>
                                <th onClick={() => requestSort('ingredients')} data-label-header="Ingredients" aria-sort={sortConfig.key === 'ingredients' ? sortConfig.direction : 'none'}>Ingredients {getSortIndicator('ingredients')}</th>
                                <th data-label-header="Download Codes">Download Codes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedBatches.map(batch => {
                                const expiryStatus = getExpiryStatus(batch.expiry_date);
                                return (
                                    // Row click handler to open the batch details modal
                                    <tr key={batch.batch_number} onClick={() => setModalBatch(batch)} role="button" tabIndex="0" aria-label={`View details for batch ${batch.batch_number}`}>
                                        <td style={{ cursor: 'default' }} className="checkbox-cell">
                                            <input
                                                type="checkbox"
                                                onClick={(e) => e.stopPropagation()} // Prevent row click when checkbox is clicked
                                                onChange={(e) => handleCheckboxClick(e, batch.batch_number)}
                                                checked={isBatchSelected(batch.batch_number)}
                                                aria-label={`Select batch ${batch.batch_number}`}
                                            />
                                        </td>
                                        <td data-label-header="Image" className="image-cell">
                                            {batch.image_url ? (
                                                <img
                                                    src={batch.image_url}
                                                    alt={batch.product_name || 'Product Image'}
                                                    className="product-image"
                                                    loading="lazy" // Lazy load images
                                                    onError={e => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://via.placeholder.com/64x64?text=No+Img'; // Generic placeholder
                                                    }}
                                                />
                                            ) : (
                                                <div className="no-image" aria-label="No image available">No Image</div>
                                            )}
                                        </td>
                                        <td data-label-header="Product Name">
                                            <span className="product-name-text">
                                                {batch.product_name || '-'}
                                            </span>
                                            {/* Truncation with tooltip can be added here if needed */}
                                        </td>
                                        <td data-label-header="Batch ID" className="batch-id-cell" title="Click to copy Batch ID">
                                            <span onClick={(e) => e.stopPropagation()}>{batch.batch_number}</span>
                                            <span
                                                className="material-symbols-outlined copy-icon"
                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(batch.batch_number, batch.batch_number); }}
                                                aria-label={`Copy batch ID ${batch.batch_number} to clipboard`}
                                            >
                                                content_copy
                                            </span>
                                            {copiedBatchId === batch.batch_number && <span className="copied-tooltip">Copied!</span>}
                                        </td>
                                        <td data-label-header="Quantity" className="quantity-cell">{batch.count ? `${new Intl.NumberFormat().format(batch.count)} pcs` : '-'}</td>
                                        <td data-label-header="Manufactured">{formatDate(batch.manufacturing_date)}</td>
                                        <td data-label-header="Expires" className={`expires-cell ${expiryStatus.class}`} title={expiryStatus.daysLeft !== null ? (expiryStatus.daysLeft < 0 ? `Expired ${-expiryStatus.daysLeft} days ago` : `Expires in ${expiryStatus.daysLeft} days`) : ''}>
                                            {formatDate(batch.expiry_date)}
                                            {expiryStatus.daysLeft !== null && expiryStatus.daysLeft < 0 && (
                                                <span className="material-symbols-outlined expiry-info-icon">cancel</span>
                                            )}
                                        </td>
                                        <td data-label-header="Ingredients" title={batch.ingredients || 'No ingredients listed'}>
                                            {batch.ingredients ? (batch.ingredients.length > 50 ? `${batch.ingredients.substring(0, 47)}...` : batch.ingredients) : '-'}
                                        </td>
                                        <td data-label-header="Download Codes" style={{ cursor: 'default' }}>
                                            <button
                                                className="download-btn"
                                                onClick={(e) => { e.stopPropagation(); downloadCodesPDF(batch); }}
                                                title="Download batch codes as PDF"
                                                disabled={isPdfLoading}
                                                aria-label={isPdfLoading ? `Generating PDF for batch ${batch.batch_number}...` : `Download PDF for batch ${batch.batch_number}`}
                                            >
                                                {isPdfLoading ? 'Generating...' : 'Download PDF'}
                                                <span className="material-symbols-outlined">download</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {!loading && !error && filteredAndSortedBatches.length > 0 && (
                <div className="pagination">
                    <span className="total-items-count">Showing {filteredAndSortedBatches.length} of {batches.length} batches</span>
                    <select
                        className="rows-per-page-selector"
                        value={rowsPerPage}
                        onChange={handleRowsPerPageChange}
                        aria-label="Number of rows per page"
                    >
                        <option value={5}>Show 5</option>
                        <option value={10}>Show 10</option>
                        <option value={25}>Show 25</option>
                        <option value={50}>Show 50</option>
                        {/* <option value={batches.length}>Show All</option> // Use with caution for very large datasets */}
                    </select>
                    {pages > 1 && (
                        <div className="page-controls">
                            <button
                                onClick={() => dispatch(fetchManufacturerProducts(page - 1, rowsPerPage))}
                                className="page-btn"
                                disabled={page === 1}
                                aria-label="Go to previous page"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            {[...Array(pages).keys()].map(x => (
                                <button
                                    key={x}
                                    onClick={() => dispatch(fetchManufacturerProducts(x + 1, rowsPerPage))}
                                    className={x + 1 === page ? 'page-btn active' : 'page-btn'}
                                    aria-current={x + 1 === page ? 'page' : undefined}
                                    aria-label={`Go to page ${x + 1}`}
                                >
                                    {x + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => dispatch(fetchManufacturerProducts(page + 1, rowsPerPage))}
                                className="page-btn"
                                disabled={page === pages}
                                aria-label="Go to next page"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Batch Details Modal */}
            <Modal isOpen={!!modalBatch} onClose={() => setModalBatch(null)} title="Batch Details">
                {modalBatch && (
                    <>
                        <p><strong>Product Name:</strong> {modalBatch.product_name || '-'}</p>
                        <p><strong>Batch ID:</strong> {modalBatch.batch_number || '-'}</p>
                        <p><strong>Quantity:</strong> {modalBatch.count ? `${new Intl.NumberFormat().format(modalBatch.count)} pcs` : '-'}</p>
                        <p><strong>Manufactured Date:</strong> {formatDate(modalBatch.manufacturing_date)}</p>
                        <p><strong>Expiry Date:</strong> {formatDate(modalBatch.expiry_date)}</p>
                        <p><strong>Ingredients:</strong> {modalBatch.ingredients || '-'}</p>
                        {modalBatch.description && <p><strong>Description:</strong> {modalBatch.description}</p>}
                        {modalBatch.gtin && <p><strong>GTIN:</strong> {modalBatch.gtin}</p>}
                    </>
                )}
            </Modal>

            {/* Toast Notification Container */}
            <div className="toast-container">
                <Toast show={toast.show} message={toast.message} type={toast.type} onClose={closeToast} />
            </div>
        </div>
    );
};

export default ManufacturerProducts;