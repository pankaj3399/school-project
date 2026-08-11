//Scool/component/
import React from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { formatMonthYearLabel } from "@/lib/academicYear";

// Register Chart.js components
ChartJS.register(BarElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

interface BarChartCardProps {
    data: number[]; // Array of 12 values
    label: string;  // Label for the chart
}

const BarChartCard: React.FC<BarChartCardProps> = ({ data, label }) => {
    const year = new Date().getFullYear();
    const chartData = {
        labels: Array.from({ length: 12 }, (_, i) => formatMonthYearLabel(i + 1, year)),
        datasets: [
            {
                label: label,
                data: data,
                backgroundColor: "rgba(75, 192, 192, 0.5)", // Bar color
                borderColor: "rgba(75, 192, 192, 1)", // Border color
                borderWidth: 1, // Border width
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
                beginAtZero: true, // Ensure Y-axis starts at zero
            },
        },
    };

    return (
        <div className="p-4 bg-white shadow rounded-lg">
            <h3 className="text-lg font-semibold mb-2">{label}</h3>
            <div className="h-64">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default BarChartCard;
