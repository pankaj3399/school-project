//school/component
import { getFormsSubmittedPerMonth, getPointsGivenPerMonth } from '@/api'
import { useEffect, useState } from 'react'
import LineChartCard from './line-chart'
import BarChartCard from './bar-chart'

const OverallStats = () => {
    const [pointsGivenPerMonth, setPointsGivenPerMonth] = useState<number[]>([])
    const [formSubmissions, setFormSubmissions] = useState<number[]>([])

    useEffect(()=>{
        const fetchData = async () => {
            const resPoints = await getPointsGivenPerMonth()
            setPointsGivenPerMonth(resPoints.monthlyPoints);
            const resForms = await getFormsSubmittedPerMonth()
            setFormSubmissions(resForms.monthlyForms)
        }
        fetchData()
    },[])
  return (
    <div className='grid grid-cols-2 gap-4 mt-2 '>
        <h4 className='col-span-2 text-3xl font-bold'>Overall</h4>
        {/* <LineChartCard label={"Total Points Given"} data={pointsGivenPerMonth} /> */}
        <BarChartCard label={"Total Points Given"} data={pointsGivenPerMonth} />
        <BarChartCard label={"Total Forms submitted"} data={formSubmissions} />
        {/* <LineChartCard label={"Total Forms submitted"} data={formSubmissions} /> */}
    </div>
  )
}

export default OverallStats