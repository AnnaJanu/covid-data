import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { FormControl, InputLabel, Select, MenuItem, Card, CardContent, Typography } from '@mui/material';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const Chart = ({ data }) => {
  const [selectedCountry, setSelectedCountry] = useState(Object.keys(data)[0]);

  const countryData = data[selectedCountry];

  const labels = countryData.map(entry => entry.date);
  const cases = countryData.map(entry => entry.cases);
  const deaths = countryData.map(entry => entry.deaths);

  const chartData = {
    labels,
    datasets: [
      {
        label: `Случаев заболевания`,
        data: cases,
        borderColor: 'lightblue',
        backgroundColor: 'lightblue',
        fill: false,
        tension: 0.4,
      },
      {
        label: `Смертей`,
        data: deaths,
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,1)',
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: false,
        text: ``,
      },
    },
    scales: {
      x:{
        display: false,
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          Выбрать страну
        </Typography>
        <FormControl fullWidth>
          <InputLabel id="country-select-label"></InputLabel>
          <Select
            labelId="country-select-label"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            {Object.keys(data).map(country => (
              <MenuItem key={country} value={country}>
                {country}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Line data={chartData} options={options} />
      </CardContent>
    </Card>
  );
};

export default Chart;
