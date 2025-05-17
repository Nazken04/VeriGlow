import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getManufacturerReportsAPI, getProductDetailsAPI } from '../../api/product';
import FraudReportFilters from './FraudReportFilters';
import "../../styles/FraudReports.css";

// --- Helper Libraries (Ensure you've installed these: npm install jspdf jspdf-autotable xlsx) ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import autoTable explicitly
import * as XLSX from 'xlsx';


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
    summaryString = individualScannerDetails.slice(0, maxScannersToShowInSummary).join('; ') +
                    ` ...(${individualScannerDetails.length - maxScannersToShowInSummary} more)`;
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
    summaryString = locationsArray.slice(0, maxLocationsToShowInSummary).join(', ') +
                    ` ...(${locationsArray.length - maxLocationsToShowInSummary} more)`;
  }
  if (summaryString.length > MAX_SUMMARY_LENGTH) {
    summaryString = summaryString.substring(0, MAX_SUMMARY_LENGTH - 3) + "...";
  }
  return { summary: summaryString, full: fullDetailsStringForTitle, expanded: expandedDetailsString };
};

const FraudReports = () => {
  const [allReportsWithDetails, setAllReportsWithDetails] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [errorReports, setErrorReports] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    searchTerm: '',
  });

  const filteredReportsList = useMemo(() => {
    if (!allReportsWithDetails) return [];
    return allReportsWithDetails.filter(item => {
      if (filters.startDate && item.report?.detectedAt) {
        if (new Date(item.report.detectedAt) < new Date(filters.startDate)) return false;
      }
      if (filters.endDate && item.report?.detectedAt) {
        const inclusiveEndDate = new Date(filters.endDate);
        inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
        if (new Date(item.report.detectedAt) >= inclusiveEndDate) return false;
      }
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const foundInProductName = (item.product_name && item.product_name.toLowerCase().includes(term)) ||
                                   (item.details?.product_name && item.details.product_name.toLowerCase().includes(term));
        const foundInBarcode = (item.details?.barcode && item.details.barcode.toLowerCase().includes(term)) ||
                               (item.details?.product_code && item.details.product_code.toLowerCase().includes(term));
        const foundInBatch = (item.batch_number && item.batch_number.toLowerCase().includes(term)) ||
                             (item.details?.batch_number && item.details.batch_number.toLowerCase().includes(term));
        const foundInLocations = item.formattedLocations?.full && item.formattedLocations.full.toLowerCase().includes(term);
        if (!(foundInProductName || foundInBarcode || foundInBatch || foundInLocations)) {
          return false;
        }
      }
      return true;
    });
  }, [allReportsWithDetails, filters]);

  const formatDate = (timestampOrDateString) => {
    if (!timestampOrDateString) return 'N/A';
    let date;
    if (Number.isFinite(timestampOrDateString)) {
        date = new Date(timestampOrDateString > 30000000000 ? timestampOrDateString : timestampOrDateString * 1000);
    } else {
        date = new Date(timestampOrDateString);
    }
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString();
  };

  useEffect(() => {
    const fetchReportsAndDetails = async () => {
      setLoadingReports(true);
      setErrorReports(null);
      setAllReportsWithDetails([]); 
      try {
        const apiResponse = await getManufacturerReportsAPI();
        if (apiResponse.success && apiResponse.data && apiResponse.data.reports) {
          const baseReports = apiResponse.data.reports || [];
          if (baseReports.length === 0) {
            setAllReportsWithDetails([]);
            setLoadingReports(false);
            return;
          }
          const augmentedReportsData = await Promise.all(
            baseReports.map(async (reportItem) => {
              try {
                const productId = reportItem.productId || `missing-${Date.now()}-${Math.random()}`;
                if (!reportItem.productId) console.warn("Report item missing productId:", reportItem);
                
                const detailResponse = await getProductDetailsAPI(productId);
                if (detailResponse.success && detailResponse.data) {
                  const formattedLocations = formatReportedLocations(detailResponse.data.counterfeitReport?.locations);
                  const formattedScanActivity = formatUserScanDetails(detailResponse.data.scanHistory);
                  return { 
                    ...reportItem, 
                    productId,
                    details: detailResponse.data, 
                    formattedLocations,
                    formattedScanActivity,
                    detailsError: null 
                  };
                } else {
                  return { 
                    ...reportItem, 
                    productId,
                    details: null, 
                    formattedLocations: { summary: 'N/A', full: 'N/A', expanded: 'N/A' },
                    formattedScanActivity: { summary: 'N/A', full: 'N/A', expanded: 'N/A' },
                    detailsError: detailResponse.error || 'Failed to fetch details' 
                  };
                }
              } catch (err) {
                const productIdOnError = reportItem.productId || `error-${Date.now()}-${Math.random()}`;
                console.error(`Error fetching details for ${productIdOnError}:`, err);
                return { 
                    ...reportItem, 
                    productId: productIdOnError,
                    details: null, 
                    formattedLocations: { summary: 'Error', full: 'Error', expanded: 'Error' },
                    formattedScanActivity: { summary: 'Error', full: 'Error', expanded: 'Error' },
                    detailsError: err.message || 'Fetch error' 
                };
              }
            })
          );
          setAllReportsWithDetails(augmentedReportsData);
        } else {
          setErrorReports(apiResponse.error || 'Failed to fetch reports: Unexpected structure.');
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setErrorReports(err.message || 'An unexpected error occurred.');
      }
      setLoadingReports(false);
    };
    fetchReportsAndDetails();
  }, []);

  const handleRowClick = (productId) => {
    setExpandedRowId(prevId => (prevId === productId ? null : productId));
  };

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const handleExportPDF = () => {
    if (filteredReportsList.length === 0) {
        alert("No data to export.");
        return;
    }
    
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text("Fraud Reports", 14, 16);

    const tableColumn = [
      "QR/Barcode", "Product Name", "Batch", "Manufactured", "Expiry",
      "Reported Scans", "Detected At", "Reported Locations", "Scan Activity" 
    ];
    const tableRows = [];

    filteredReportsList.forEach(item => {
      const reportData = [
        item.details?.barcode || item.details?.product_code || item.productId || 'N/A',
        item.product_name || item.details?.product_name || 'N/A',
        item.batch_number || item.details?.batch_number || 'N/A',
        item.details ? formatDate(item.details.manufacturing_date) : 'N/A',
        item.details ? formatDate(item.details.expiry_date) : 'N/A',
        item.report?.scanCount ?? 'N/A',
        item.report ? formatDateTime(item.report.detectedAt) : 'N/A',
        item.formattedLocations?.expanded || 'N/A', 
        item.formattedScanActivity?.expanded || 'N/A'
      ];
      tableRows.push(reportData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'striped', 
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' }, 
      headStyles: { fillColor: [156, 115, 104] }, 
      columnStyles: { 
        7: { cellWidth: 50 }, 
        8: { cellWidth: 60 },
      }
    });
    doc.save("fraud_reports.pdf");
  };

  const handleExportExcel = () => {
    if (filteredReportsList.length === 0) {
        alert("No data to export.");
        return;
    }

    const simplifiedData = filteredReportsList.map(item => ({
      "QR/Barcode": item.details?.barcode || item.details?.product_code || item.productId || 'N/A',
      "Product Name": item.product_name || item.details?.product_name || 'N/A',
      "Batch Number": item.batch_number || item.details?.batch_number || 'N/A',
      "Manufactured": item.details ? formatDate(item.details.manufacturing_date) : 'N/A',
      "Expiry": item.details ? formatDate(item.details.expiry_date) : 'N/A',
      "Reported Scans": item.report?.scanCount ?? 'N/A',
      "Detected At": item.report ? formatDateTime(item.report.detectedAt) : 'N/A',
      "Reported Locations (Full)": item.formattedLocations?.expanded || 'N/A', 
      "Scan Activity (Full)": item.formattedScanActivity?.expanded || 'N/A'
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

    XLSX.writeFile(workbook, "fraud_reports.xlsx");
  };

  const columnHeaders = {
    image: "Image",
    qrBarcode: "QR/Barcode",
    productName: "Product Name",
    batchNumber: "Batch Number",
    manufactured: "Manufactured",
    expiry: "Expiry",
    reportedScans: "Reported Scans",
    detectedAt: "Detected At",
    reportedLocations: "Reported Locations",
    scanActivity: "Scan Activity by User"
  };

  return (
    <div className="fraud-reports-container">
      <FraudReportFilters 
        onFilterChange={handleFilterChange}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        hasData={filteredReportsList.length > 0}
      />

      {loadingReports && <p className="loading-text">Loading reports and product details...</p>}
      {errorReports && <p className="error-text">Error: {errorReports}</p>}
      
      {!loadingReports && !errorReports && (
        filteredReportsList.length === 0 ? (
          filters.searchTerm || filters.startDate || filters.endDate ? 
            <p className="loading-text">No fraud reports match your filter criteria.</p> :
            <p className="loading-text">No fraud reports found.</p> 
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>{columnHeaders.image}</th>
                <th>{columnHeaders.qrBarcode}</th>
                <th>{columnHeaders.productName}</th>
                <th>{columnHeaders.batchNumber}</th>
                <th>{columnHeaders.manufactured}</th>
                <th>{columnHeaders.expiry}</th>
                <th>{columnHeaders.reportedScans}</th>
                <th>{columnHeaders.detectedAt}</th>
                <th className="column-reported-locations">{columnHeaders.reportedLocations}</th>
                <th className="column-scan-activity">{columnHeaders.scanActivity}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportsList.map((item) => (
                <tr 
                    key={item.productId} 
                    onClick={() => handleRowClick(item.productId)}
                    className={expandedRowId === item.productId ? 'expanded-row' : ''}
                >
                  <td data-label={columnHeaders.image}>
                    {item.details?.image_url ? (
                       <img 
                        src={item.details.image_url}
                        alt={item.product_name || 'Product'} 
                        className="product-image"
                        onError={(e) => { e.target.onerror = null; e.target.src="/alt-placeholder-image.png"; }}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td data-label={columnHeaders.qrBarcode}>
                    {item.details?.barcode || item.details?.product_code || item.details?._id || item.productId || 'N/A'}
                  </td>
                  <td data-label={columnHeaders.productName}>{item.product_name || (item.details?.product_name) || 'N/A'}</td>
                  <td data-label={columnHeaders.batchNumber}>{item.batch_number || (item.details?.batch_number) || 'N/A'}</td>
                  <td data-label={columnHeaders.manufactured}>{item.details ? formatDate(item.details.manufacturing_date) : (item.detailsError || 'N/A')}</td>
                  <td data-label={columnHeaders.expiry}>{item.details ? formatDate(item.details.expiry_date) : (item.detailsError || 'N/A')}</td>
                  <td data-label={columnHeaders.reportedScans}>{item.report?.scanCount ?? 'N/A'}</td>
                  <td data-label={columnHeaders.detectedAt}>{item.report ? formatDateTime(item.report.detectedAt) : 'N/A'}</td>
                  <td 
                    data-label={columnHeaders.reportedLocations} 
                    title={expandedRowId !== item.productId ? (item.formattedLocations?.full || (item.detailsError || 'N/A')) : ''}
                    className="cell-reported-locations"
                  >
                    <pre className="expandable-content">
                        {expandedRowId === item.productId 
                            ? (item.formattedLocations?.expanded || (item.detailsError || 'N/A'))
                            : (item.formattedLocations?.summary || (item.detailsError || 'N/A'))
                        }
                    </pre>
                  </td>
                  <td 
                    data-label={columnHeaders.scanActivity}
                    title={expandedRowId !== item.productId ? (item.formattedScanActivity?.full || (item.detailsError || 'N/A')) : ''}
                    className="cell-scan-activity"
                  >
                     <pre className="expandable-content">
                        {expandedRowId === item.productId 
                            ? (item.formattedScanActivity?.expanded || (item.detailsError || 'N/A'))
                            : (item.formattedScanActivity?.summary || (item.detailsError || 'N/A'))
                        }
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
};

export default FraudReports;