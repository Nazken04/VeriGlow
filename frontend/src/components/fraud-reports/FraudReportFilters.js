import React, { useState } from 'react';
import '../../styles/FraudReportFilters.css'; // We'll create this CSS file

const FraudReportFilters = ({ onFilterChange, onExportPDF, onExportExcel, hasData }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFilter = (e) => {
    e.preventDefault();
    onFilterChange({ startDate, endDate, searchTerm });
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    onFilterChange({ startDate: '', endDate: '', searchTerm: '' });
  };

  return (
    <div className="fraud-filters-container">
      <form onSubmit={handleFilter} className="filter-form">
        <div className="filter-group">
          <label htmlFor="startDate">Detected From:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="endDate">Detected To:</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="filter-group filter-group-search">
          <label htmlFor="searchTerm">Search Term:</label>
          <input
            type="text"
            id="searchTerm"
            placeholder="QR, Product, Batch, Location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <button type="submit" className="filter-btn apply-btn">Apply Filters</button>
          <button type="button" onClick={handleClearFilters} className="filter-btn clear-btn">Clear Filters</button>
        </div>
      </form>
      {hasData && ( // Only show export buttons if there's data to export
        <div className="export-actions">
          <button onClick={onExportPDF} className="export-btn pdf-btn">Download PDF</button>
          <button onClick={onExportExcel} className="export-btn excel-btn">Download Excel</button>
        </div>
      )}
    </div>
  );
};

export default FraudReportFilters;