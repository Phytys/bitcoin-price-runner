// static/js/price_chart.js

// Fetch Bitcoin price data and render the chart
document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('price-chart').getContext('2d');

    fetch('/terrain_data')
        .then(response => response.json())
        .then(data => {
            const dates = data.map(entry => {
                const date = new Date(entry.date_unix);
                return date.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                });
            });
            const prices = data.map(entry => entry.ma_7);

            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Bitcoin Price',
                        data: prices,
                        borderColor: '#00ffff',
                        backgroundColor: 'rgba(0, 255, 255, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        lineTension: 0.2,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 2,  // This will make the chart twice as wide as it is tall
                    scales: {
                        x: {
                            display: true,
                            ticks: {
                                color: '#ffffff',
                            },
                            grid: {
                                color: '#333333',
                            }
                        },
                        y: {
                            display: true,
                            ticks: {
                                color: '#ffffff',
                            },
                            grid: {
                                color: '#333333',
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                        tooltip: {
                            enabled: true,
                            callbacks: {
                                label: function(context) {
                                    return `Price: $${context.parsed.y.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    elements: {
                        point: {
                            radius: 0
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching Bitcoin price data:', error);
        });
});
