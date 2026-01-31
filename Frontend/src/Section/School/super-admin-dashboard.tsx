import { useAuth } from '../../authContext';
import { Navigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'Admin';

    // Redirect if not authorized
    if (!isSuperAdmin) {
        return <Navigate to="/home" replace />;
    }

    const handleDownloadWaitlist = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/waitlist/export`, {
                method: 'GET',
                headers: {
                    'token': `${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download waitlist');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading waitlist:', error);
            alert('Failed to download waitlist data');
        }
    };

    return (
        <div className='p-6 bg-gray-50 min-h-screen'>
            <div className='w-full bg-white rounded-lg shadow p-6'>
                <h1 className='text-2xl font-bold mb-6 text-gray-800'>Super Admin Controls</h1>
                <div className='flex justify-start'>
                    <button
                        onClick={handleDownloadWaitlist}
                        className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm'
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download Waitlist CSV
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SuperAdminDashboard;
