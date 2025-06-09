import { getManufacturerReportsAPI, getProductDetailsAPI } from '../../api/product';

export const FETCH_FRAUD_REPORTS_REQUEST = 'FETCH_FRAUD_REPORTS_REQUEST';
export const FETCH_FRAUD_REPORTS_SUCCESS = 'FETCH_FRAUD_REPORTS_SUCCESS';
export const FETCH_FRAUD_REPORTS_FAILURE = 'FETCH_FRAUD_REPORTS_FAILURE';

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


export const fetchFraudReports = () => async (dispatch) => {
    dispatch({ type: FETCH_FRAUD_REPORTS_REQUEST });
    try {
        const apiResponse = await getManufacturerReportsAPI();
        if (apiResponse.success && apiResponse.data && apiResponse.data.reports) {
            const baseReports = apiResponse.data.reports || [];
            if (baseReports.length === 0) {
                dispatch({ type: FETCH_FRAUD_REPORTS_SUCCESS, payload: [] });
                return;
            }

            const augmentedReportsData = await Promise.all(
                baseReports.map(async (reportItem) => {
                    try {
                        const productId = reportItem.productId || reportItem.productCode || reportItem._id || `missing-${Date.now()}-${Math.random()}`;
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
            dispatch({ type: FETCH_FRAUD_REPORTS_SUCCESS, payload: augmentedReportsData });
        } else {
            dispatch({ 
                type: FETCH_FRAUD_REPORTS_FAILURE, 
                payload: apiResponse.error || 'Failed to fetch reports: Unexpected structure.' 
            });
        }
    } catch (err) {
        console.error("Error fetching fraud reports:", err);
        dispatch({ 
            type: FETCH_FRAUD_REPORTS_FAILURE, 
            payload: err.message || 'An unexpected error occurred while fetching fraud reports.' 
        });
    }
};