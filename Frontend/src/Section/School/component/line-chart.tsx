//Scool/component/
import React from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend, Filler);

interface LineChartCardProps {
    data: number[]; // Array of 12 values
    label: string;  // Label for the chart
}

const LineChartCard: React.FC<LineChartCardProps> = ({ data, label }) => {
    const chartData = {
        labels: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
        datasets: [
            {
                label: label,
                data: data,
                borderColor: "rgba(75, 192, 192, 1)", // Line color
                backgroundColor: "rgba(75, 192, 192, 0.2)", // Fill color with opacity
                borderWidth: 2,
                tension: 0.4, // Smooth the curve
                fill: true,  // Enable filling under the line
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false, // Hide legend (optional)
            },
        },
        scales: {
            x: {
                grid: {
                    display: false, // Hide grid lines for X-axis (optional)
                },
            },
            y: {
                grid: {
                    color: "rgba(200, 200, 200, 0.2)", // Subtle grid lines for Y-axis
                },

            },
        },
    };

    return (
        <div className="p-4 bg-white shadow rounded-lg">
            <h3 className="text-lg font-semibold mb-2">{label}</h3>
            <div className="h-64">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default LineChartCard;
