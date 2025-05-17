import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchManufacturerProducts,
    fetchProductsByBatchAPI
} from '../../redux/actions/productActions'; // Adjust path
import jsPDF from 'jspdf';
import "../../styles/Products.css"; // Ensure this path is correct

const ManufacturerProducts = () => {
    const dispatch = useDispatch();
    const { batches, loading, error, page, pages } = useSelector((state) => state.product);

    useEffect(() => {
        dispatch(fetchManufacturerProducts(page || 1));
    }, [dispatch, page]);

    const formatDate = (dateValue) => {
        if (!dateValue) return '-';
        try {
            let date;
            if (typeof dateValue === 'number') {
                if (dateValue < 100000000000) { // Heuristic for seconds vs ms
                    date = new Date(dateValue * 1000);
                } else {
                    date = new Date(dateValue);
                }
            } else {
                date = new Date(dateValue);
            }
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }).replace(/\//g, '.');
        } catch (e) {
            console.error("Error formatting date:", dateValue, e);
            return '-';
        }
    };

    const downloadCodesPDF = async (batchSummary) => {
        console.log("PDF generation initiated for batch (summary):", batchSummary.batch_number);
        try {
            const result = await fetchProductsByBatchAPI(batchSummary.batch_number);

            if (!result.success || !result.data || result.data.length === 0) {
                alert(result.error || `No individual products found for batch ${batchSummary.batch_number} to generate PDF.`);
                return;
            }

            const individualProducts = result.data;
            console.log(`Fetched ${individualProducts.length} individual products for batch ${batchSummary.batch_number} for PDF.`);

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            let yPosition = 20;
            const leftMargin = 15;
            const itemsPerPage = 3;

            pdf.setFontSize(16);
            pdf.text(`Product: ${batchSummary.product_name || 'N/A'}`, leftMargin, yPosition);
            yPosition += 8;

            pdf.setFontSize(12);
            pdf.text(`Batch ID: ${batchSummary.batch_number}`, leftMargin, yPosition);
            yPosition += 7;

            pdf.text(`Quantity (Items in Batch): ${individualProducts.length}`, leftMargin, yPosition);
            yPosition += 7;

            pdf.text(`Manufactured: ${formatDate(batchSummary.manufacturing_date)}`, leftMargin, yPosition);
            yPosition += 7;

            pdf.text(`Expires: ${formatDate(batchSummary.expiry_date)}`, leftMargin, yPosition);
            yPosition += 12;

            for (let i = 0; i < individualProducts.length; i++) {
                const currentProduct = individualProducts[i];

                if (i > 0 && i % itemsPerPage === 0) {
                    pdf.addPage();
                    yPosition = 20;
                }

                const itemStartY = yPosition;
                const barcodeX = leftMargin;
                const barcodeY = itemStartY;
                const barcodeWidth = 100;
                const barcodeHeight = 30;
                let barcodeStatusMessage = "";

                if (currentProduct.barcode_image && typeof currentProduct.barcode_image === 'string' && currentProduct.barcode_image.startsWith('data:image')) {
                    try {
                        const parts = currentProduct.barcode_image.split(',');
                        if (parts.length === 2) {
                            const meta = parts[0]; const base64Data = parts[1];
                            const formatMatch = meta.match(/data:image\/([a-zA-Z+]+);base64/);
                            const imageFormat = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
                            pdf.addImage(base64Data, imageFormat, barcodeX, barcodeY, barcodeWidth, barcodeHeight);
                        } else { barcodeStatusMessage = "[Barcode: Invalid URI]"; }
                    } catch (imgErr) { barcodeStatusMessage = "[Barcode: Load Error]"; console.error(`Barcode Img Error (item ${i + 1}):`, imgErr); }
                } else {
                    barcodeStatusMessage = "[No Barcode Img]";
                    if (!currentProduct.barcode_image) console.warn(`Item ${i + 1} missing barcode_image field.`);
                    else console.warn(`Item ${i + 1} barcode_image not a data URI: ${currentProduct.barcode_image.substring(0, 50)}`);
                }
                if (barcodeStatusMessage) { pdf.setFontSize(8).text(barcodeStatusMessage, barcodeX + barcodeWidth / 2, barcodeY + barcodeHeight / 2, { align: 'center' }); }

                const qrCodeX = barcodeX + barcodeWidth + 5;
                const qrCodeY = itemStartY;
                const qrCodeSize = Math.min(50, barcodeHeight);
                let qrStatusMessage = "";

                if (currentProduct.qr_code_image && typeof currentProduct.qr_code_image === 'string' && currentProduct.qr_code_image.startsWith('data:image')) {
                    try {
                        const parts = currentProduct.qr_code_image.split(',');
                        if (parts.length === 2) {
                            const meta = parts[0]; const base64Data = parts[1];
                            const formatMatch = meta.match(/data:image\/([a-zA-Z+]+);base64/);
                            const imageFormat = formatMatch ? formatMatch[1].toUpperCase() : 'PNG';
                            pdf.addImage(base64Data, imageFormat, qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
                        } else { qrStatusMessage = "[QR: Invalid URI]"; }
                    } catch (imgErr) { qrStatusMessage = "[QR: Load Error]"; console.error(`QR Img Error (item ${i + 1}):`, imgErr); }
                } else {
                    qrStatusMessage = "[No QR Img]";
                    if (!currentProduct.qr_code_image) console.warn(`Item ${i + 1} missing qr_code_image field.`);
                    else console.warn(`Item ${i + 1} qr_code_image not a data URI: ${currentProduct.qr_code_image.substring(0, 50)}`);
                }
                if (qrStatusMessage) { pdf.setFontSize(8).text(qrStatusMessage, qrCodeX + qrCodeSize / 2, qrCodeY + qrCodeSize / 2, { align: 'center' }); }

                const textY = barcodeY + barcodeHeight + 5;
                pdf.setFontSize(10);
                if (currentProduct.barcode) {
                    pdf.text(`Item ${i + 1}: ${currentProduct.barcode}`, leftMargin, textY);
                } else {
                    pdf.text(`Item ${i + 1}: No Barcode Text`, leftMargin, textY);
                }

                yPosition = itemStartY + Math.max(barcodeHeight, qrCodeSize) + 15;
                if (yPosition > (pdf.internal.pageSize.height - 30) && (i + 1) < individualProducts.length) {
                    pdf.addPage();
                    yPosition = 20;
                }
            }
            pdf.save(`codes_batch_${batchSummary.batch_number}.pdf`);
        } catch (err) {
            console.error('Error in downloadCodesPDF function:', err);
            alert('Failed to generate PDF. ' + (err.message || err.toString()) + '\nPlease check console for details.');
        }
    };


    return (
        <div className="manufacturer-products-container">
            <div className="page-intro-section">
                <h3 className="page-intro-title">Batch Overview</h3>
                <p className="page-intro-description">
                    On this page, you can view the products registered within each manufacturing batch.
                    For every batch, you can see details such as product name, quantity, manufacturing and expiry dates,
                    and ingredients. You also have the option to download a PDF file containing the unique codes
                    for all individual items within that specific batch.
                </p>
            </div>


            {loading && <p className="loading-text">Loading...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && batches && batches.length === 0 && <p className="no-data-text">No batches found.</p>}

            {!loading && batches && batches.length > 0 && (
                <>
                    <table className="batches-table">
                        <thead>
                            <tr>
                                <th data-label-header="Image">Image</th>
                                <th data-label-header="Product Name">Product Name</th>
                                <th data-label-header="Batch ID">Batch ID</th>
                                <th data-label-header="Quantity">Quantity</th>
                                <th data-label-header="Manufactured">Manufactured</th>
                                <th data-label-header="Expires">Expires</th>
                                <th data-label-header="Ingredients">Ingredients</th>
                                <th data-label-header="Download Codes">Download Codes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map(batch => (
                                <tr key={batch.batch_number}>
                                    <td data-label="Image">
                                        {batch.image_url ? (
                                            <img
                                                src={batch.image_url}
                                                alt={batch.product_name || 'Product Image'}
                                                className="product-image"
                                                onError={e => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/100x70?text=No+Image';
                                                }}
                                            />
                                        ) : (
                                            <div className="no-image">No Image</div>
                                        )}
                                    </td>
                                    <td data-label="Product Name">{batch.product_name || '-'}</td>
                                    <td data-label="Batch ID">{batch.batch_number}</td>
                                    <td data-label="Quantity">{batch.count || '-'}</td>
                                    <td data-label="Manufactured">{formatDate(batch.manufacturing_date)}</td>
                                    <td data-label="Expires">{formatDate(batch.expiry_date)}</td>
                                    <td data-label="Ingredients">{batch.ingredients || '-'}</td>
                                    <td data-label="Download Codes">
                                        <button
                                            className="download-btn"
                                            onClick={() => downloadCodesPDF(batch)}
                                            title="Download batch codes as PDF"
                                        >
                                            Download PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {pages > 1 && (
                <div className="pagination">
                    {[...Array(pages).keys()].map(x => (
                        <button
                            key={x}
                            onClick={() => dispatch(fetchManufacturerProducts(x + 1))}
                            className={x + 1 === page ? 'page-btn active' : 'page-btn'}
                        >
                            {x + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManufacturerProducts;