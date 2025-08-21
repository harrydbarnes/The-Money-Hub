import React, { useState, useEffect, useCallback } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemText, Grid, Paper, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const drawerWidth = 240;

// --- Data Analysis Logic (re-implemented from Python) ---

const analyzeData = (data) => {
  if (!data || data.length === 0) return null;

  // Helper to group by a key and sum a value
  const groupByAndSum = (items, key, valueKey) => {
    return items.reduce((acc, item) => {
      const group = item[key];
      if (group) {
        acc[group] = (acc[group] || 0) + (parseFloat(item[valueKey]) || 0);
      }
      return acc;
    }, {});
  };

  const getTopN = (data, n) => Object.fromEntries(Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, n));


  // Convert date columns
  data.forEach(row => {
    if (row.query_date) row.query_date = new Date(row.query_date);
    if (row.close_date) row.close_date = new Date(row.close_date);
    if (row.query_date && row.close_date) {
      row.ticket_duration = (row.close_date - row.query_date) / (1000 * 60 * 60 * 24); // in days
    }
  });

  const top_supplier_queried_amount = getTopN(groupByAndSum(data, 'supplier', 'amount'), 5);
  const top_buyer_queried_amount = getTopN(groupByAndSum(data, 'buyer', 'amount'), 5);
  const top_client_queried_amount = getTopN(groupByAndSum(data, 'client', 'amount'), 5);

  const amount_per_year = data.reduce((acc, item) => {
    if (item.query_date) {
      const year = item.query_date.getFullYear();
      acc[year] = (acc[year] || 0) + (parseFloat(item.amount) || 0);
    }
    return acc;
  }, {});

  const with_finance = {
    count: data.filter(r => r.financed === true || r.financed === 'true').length,
    total: data.length,
  };

  const average_ticket_duration = data.reduce((acc, item) => acc + (item.ticket_duration || 0), 0) / data.length;

  const buyer_durations = data.reduce((acc, item) => {
    if (item.buyer && item.ticket_duration) {
      if (!acc[item.buyer]) acc[item.buyer] = [];
      acc[item.buyer].push(item.ticket_duration);
    }
    return acc;
  }, {});

  const avg_buyer_durations = Object.fromEntries(
    Object.entries(buyer_durations).map(([buyer, durations]) => [buyer, durations.reduce((a, b) => a + b, 0) / durations.length])
  );

  const best_buyers_for_quickest_replies = getTopN(avg_buyer_durations, 5);


  const most_closed = getTopN(data.reduce((acc, item) => {
    if (item.buyer && item.close_date) {
      acc[item.buyer] = (acc[item.buyer] || 0) + 1;
    }
    return acc;
  }, {}), 5);


  return {
    top_supplier_queried_amount,
    top_buyer_queried_amount,
    top_client_queried_amount,
    amount_per_year,
    with_finance,
    average_ticket_duration,
    best_buyers_for_quickest_replies,
    most_closed
  };
};


// --- Components ---

function DataVisuals({ data }) {
    const formatDataForChart = (chartData) => {
        if (!chartData) return [];
        return Object.entries(chartData).map(([name, value]) => ({ name, value }));
    };

    const renderList = (listData) => {
        if (!listData) return null;
        return (
          <ul style={{ paddingLeft: '20px' }}>
            {Object.entries(listData).map(([key, value]) => (
              <li key={key}>{key}: {typeof value === 'number' ? value.toFixed(2) : value}</li>
            ))}
          </ul>
        );
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
                    <Typography variant="h6">Top Suppliers</Typography>
                    <ResponsiveContainer>
                        <BarChart data={formatDataForChart(data.top_supplier_queried_amount)}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" name="Amount" fill="#8884d8" /></BarChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>
            {/* Add other charts here */}
             <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
                    <Typography variant="h6">Top Buyers</Typography>
                    <ResponsiveContainer>
                        <BarChart data={formatDataForChart(data.top_buyer_queried_amount)}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" name="Amount" fill="#82ca9d" /></BarChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
                    <Typography variant="h6">Top Clients</Typography>
                    <ResponsiveContainer>
                        <BarChart data={formatDataForChart(data.top_client_queried_amount)}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="value" name="Amount" fill="#ffc658" /></BarChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
                    <Typography variant="h6">Amount Per Year</Typography>
                    <ResponsiveContainer>
                        <LineChart data={formatDataForChart(data.amount_per_year)}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="value" name="Amount" stroke="#8884d8" /></LineChart>
                    </ResponsiveContainer>
                </Paper>
            </Grid>
             <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Average Ticket Duration</Typography>
                    <Typography variant="h4">{data.average_ticket_duration ? data.average_ticket_duration.toFixed(2) : 0} days</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Queries with Finance</Typography>
                    <Typography variant="h4">{data.with_finance.count} / {data.with_finance.total}</Typography>
                </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Best Buyers (Quickest Replies)</Typography>
                    {renderList(data.best_buyers_for_quickest_replies)}
                </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Most Closed Tickets</Typography>
                    {renderList(data.most_closed)}
                </Paper>
            </Grid>
        </Grid>
    );
}

function App() {
  const [rawData, setRawData] = useState([]);
  const [analyzedData, setAnalyzedData] = useState(null);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(() => localStorage.getItem('selectedYear') || 'all');

  useEffect(() => {
    localStorage.setItem('selectedYear', selectedYear);
    if (rawData.length > 0) {
      const filtered = selectedYear === 'all' ? rawData : rawData.filter(r => r.query_date && r.query_date.getFullYear() === parseInt(selectedYear));
      setAnalyzedData(analyzeData(filtered));
    }
  }, [selectedYear, rawData]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      let parsedData;
      if (file.name.endsWith('.csv')) {
        parsedData = Papa.parse(data, { header: true, skipEmptyLines: true }).data;
      } else {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      }
      setRawData(parsedData);
      const allYears = [...new Set(parsedData.map(r => r.query_date && new Date(r.query_date).getFullYear()).filter(Boolean))].sort();
      setYears(allYears);
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };


  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Data Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {['Home', 'View 1', 'View 2', 'View 3'].map((text) => (
              <ListItem button key={text}>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h5">Upload Data</Typography>
          <Button variant="contained" component="label">
            Upload File
            <input type="file" hidden onChange={handleFileUpload} accept=".csv, .xls, .xlsx" />
          </Button>
          {rawData.length > 0 && (
             <FormControl sx={{ m: 1, minWidth: 120 }}>
                <InputLabel>Year</InputLabel>
                <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
                    <MenuItem value="all">All Years</MenuItem>
                    {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
            </FormControl>
          )}
        </Paper>
        {analyzedData ? <DataVisuals data={analyzedData} /> : <Typography>Upload a file to get started.</Typography>}
      </Box>
    </Box>
  );
}

export default App;
