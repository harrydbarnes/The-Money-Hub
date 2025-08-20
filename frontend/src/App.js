import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

function DataVisuals({ data }) {
  const formatDataForChart = (chartData) => {
    if (!chartData) return [];
    return Object.entries(chartData).map(([name, value]) => ({ name, value }));
  };

  const renderList = (listData) => {
    if (!listData) return null;
    return (
      <ul>
        {Object.entries(listData).map(([key, value]) => (
          <li key={key}>{key}: {typeof value === 'number' ? value.toFixed(2) : value}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="metrics-grid">
      <div className="metric-card">
        <h3>Top Suppliers</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatDataForChart(data.top_supplier_queried_amount)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Amount" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="metric-card">
        <h3>Top Buyers</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatDataForChart(data.top_buyer_queried_amount)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Amount" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="metric-card">
        <h3>Top Clients</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formatDataForChart(data.top_client_queried_amount)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Amount" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="metric-card">
        <h3>Amount Per Year</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formatDataForChart(data.amount_per_year)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" name="Amount" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="metric-card">
        <h3>Average Ticket Duration</h3>
        <p>{data.average_ticket_duration ? data.average_ticket_duration.toFixed(2) : 0} days</p>
      </div>
      <div className="metric-card">
        <h3>Queries with Finance</h3>
        <p>{data.with_finance.count} / {data.with_finance.total}</p>
      </div>
      <div className="metric-card">
        <h3>Best Buyers (Quickest Replies)</h3>
        {renderList(data.best_buyers_for_quickest_replies)}
      </div>
      <div className="metric-card">
        <h3>Most Closed Tickets (by Buyer)</h3>
        {renderList(data.most_closed)}
      </div>
    </div>
  );
}


function App() {
  const [file, setFile] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [error, setError] = useState(null);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setOriginalData(response.data);
      setFilteredData(response.data);
      setYears(response.data.years || []);
      setSelectedYear('all');
      setError(null);
    } catch (err) => {
      setError('Error uploading file. Please check the console for details.');
      console.error(err);
    }
  };

  const handleYearChange = async (event) => {
    const year = event.target.value;
    setSelectedYear(year);

    if (year === 'all') {
      setFilteredData(originalData);
    } else {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/filter?year=${year}`);
        setFilteredData(response.data);
        setError(null);
      } catch (err) {
        setError('Error filtering data. Please check the console for details.');
        console.error(err);
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <button className="home-button" onClick={() => {
          setOriginalData(null);
          setFilteredData(null);
        }}>Home</button>
        <nav>
          <ul>
            <li><a href="#view1">View 1</a></li>
            <li><a href="#view2">View 2</a></li>
            <li><a href="#view3">View 3</a></li>
          </ul>
        </nav>
      </div>
      <div className="main-content">
        <header>
          <h1>Dashboard</h1>
          {originalData && (
            <div className="slider-container">
              <label htmlFor="year-select">Year:</label>
              <select id="year-select" value={selectedYear} onChange={handleYearChange}>
                <option value="all">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </header>
        <div className="upload-section">
          <h2>Upload Data</h2>
          <form onSubmit={handleSubmit}>
            <input type="file" onChange={handleFileChange} />
            <button type="submit">Upload</button>
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
        {filteredData ? <DataVisuals data={filteredData} /> : (
          <div className="metrics-grid">
            <div className="metric-card">Upload a file to see the data</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
