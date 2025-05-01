// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CosmeticsAuth {
    struct Product {
        string productName;
        string batchNumber;
        uint manufacturingDate;
        uint expiryDate;
        string ingredients;
        string qrCode;
    }

    struct FraudReport {
        string fraudReason;
        uint scanCount;
        string locationDetails;
        uint timestamp;
    }

    mapping(string => Product) public productRegistry;
    mapping(string => FraudReport[]) public fraudReports; // Map productId to fraud reports

    event ProductRegistered(string qrCode, string productName, string batchNumber);
    event FraudReported(string productId, string fraudReason, uint scanCount, string locationDetails);

    // Register a new product
    function registerProduct(
        string memory qrCode,
        string memory productName,
        string memory batchNumber,
        uint manufacturingDate,
        uint expiryDate,
        string memory ingredients
    ) public {
        productRegistry[qrCode] = Product(
            productName,
            batchNumber,
            manufacturingDate,
            expiryDate,
            ingredients,
            qrCode
        );

        emit ProductRegistered(qrCode, productName, batchNumber);
    }

    // Verify product authenticity
    function verifyProduct(string memory qrCode) public view returns (bool) {
        return bytes(productRegistry[qrCode].qrCode).length > 0;
    }

    // Report fraudulent activity (e.g., multiple scans from different locations)
    function reportFraud(
        string memory productId,
        string memory fraudReason,
        uint scanCount,
        string memory locationDetails
    ) public {
        // Add the fraud report to the fraudReports mapping
        fraudReports[productId].push(FraudReport({
            fraudReason: fraudReason,
            scanCount: scanCount,
            locationDetails: locationDetails,
            timestamp: block.timestamp // Store the timestamp of the report
        }));

        // Emit an event to notify about the fraud report
        emit FraudReported(productId, fraudReason, scanCount, locationDetails);
    }

    // Retrieve all fraud reports for a specific product
    function getFraudReports(string memory productId) public view returns (FraudReport[] memory) {
        return fraudReports[productId];
    }
}
