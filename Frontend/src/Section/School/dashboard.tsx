//School/dashboard.tsx
import CurrentWeekCharts from './component/current-week-charts'
import EducationYearChart from './component/new-chart'
import TeacherRanks from './component/TeacherRanks'

const AdminDashboard = () => {


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
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <button
          onClick={handleDownloadWaitlist}
          className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors'
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Waitlist CSV
        </button>
      </div>

      <div className='grid grid-cols-4'>
        <div className='col-span-3'>
          <EducationYearChart studentId='' />
          <CurrentWeekCharts studentId='' />
        </div>
        <TeacherRanks studentId='' />
      </div>
    </div>
  )
}

export default AdminDashboard
