// ExcelToJsonConverter.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const ExcelToJsonConverter = () => {
  const [jsonData, setJsonData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryStr = event.target.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON with headers as keys
        const excelJson = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Find the index of the header row (if it exists in the data)
        const headerRowIndex = excelJson.findIndex(row => 
          row[0] === 'Ad.No.' && row[1] === 'Name' && row[3] === 'Class'
        );

        // Start processing from the row after the header
        const dataRows = excelJson.slice(headerRowIndex + 1);

        // Filter out empty rows and map to the required JSON structure
        const result = dataRows
          .filter(row => row.length >= 4 && row[0] != null && row[0] !== '') // Ensure Ad.No. is present
          .map(row => ({
            admissionNo: String(row[0]).trim(), // Convert to string
            name: String(row[1]).trim(),        // Convert to string
            class: String(row[3]).toString().trim() // Convert to string
          }));

        setJsonData(result);
        setError(null);
      } catch (err) {
        setError('Failed to parse Excel file. Please ensure it matches the expected format.');
        console.error('Error parsing file:', err);
      }
    };

    reader.readAsBinaryString(file);
  };

  const downloadJson = () => {
    if (!jsonData || jsonData.length === 0) return;
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Excel to JSON Converter</h2>
      <p>Upload your Excel file (e.g., <code>Book1.xlsx</code>) to convert it to JSON.</p>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        style={{ marginBottom: '20px', padding: '8px' }}
      />

      {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

      {jsonData && jsonData.length > 0 && (
        <div>
          <h3>Conversion Successful! ({jsonData.length} records)</h3>
          <pre
            style={{
              background: '#f4f4f4',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '400px',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {JSON.stringify(jsonData, null, 2)}
          </pre>
          <br />
          <button
            onClick={downloadJson}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Download JSON File
          </button>
        </div>
      )}

      {jsonData && jsonData.length === 0 && (
        <div style={{ color: 'orange' }}>
          The file was processed, but no data rows were found.
        </div>
      )}
    </div>
  );
};

export default ExcelToJsonConverter;