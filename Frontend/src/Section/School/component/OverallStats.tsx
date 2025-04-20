//school/component
import { getFormsSubmittedPerMonth, getMonthlyStats, getPointsGivenPerMonth } from '@/api'
import { useEffect, useState } from 'react'
import BarChartCard from './bar-chart'

const OverallStats = () => {
    const [pointsGivenPerMonth, setPointsGivenPerMonth] = useState<number[]>([])
    const [formSubmissions, setFormSubmissions] = useState<number[]>([])
    const [monthlyStats, setMonthlyStats] = useState<any[]>([])

    useEffect(()=>{
        const fetchData = async () => {
            const resPoints = await getPointsGivenPerMonth()
            setPointsGivenPerMonth(resPoints.monthlyPoints);
            const resForms = await getFormsSubmittedPerMonth()
            setFormSubmissions(resForms.monthlyForms)
            const resStats = await getMonthlyStats();
            setMonthlyStats(resStats.monthlyStats)
        }
        fetchData()
    },[])
  return (
    <div className='grid grid-cols-2 gap-4 mt-2 '>
        <h4 className='col-span-2 text-3xl font-bold'>Overall</h4>
        <BarChartCard label={"Awarded Points"} data={pointsGivenPerMonth} />
        <BarChartCard label={"Forms submitted"} data={formSubmissions} />
        <BarChartCard label={"Total Oopsie"} data={monthlyStats.map(monthlyStat => monthlyStat.totalNegativePoints)} />
        <BarChartCard label={"Feedbacks"} data={monthlyStats.map(monthlyStat => monthlyStat.feedbackCount)} />
    </div>
  )
}

export default OverallStats