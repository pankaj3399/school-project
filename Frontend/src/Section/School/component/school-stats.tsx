//school/component
import { memo } from "react"


const SchoolStats = memo(({stats}:{
  stats:{
    teachers: number;
    students: number;
    points: number;
}
}) => {
  
  return (
    <div className='h-fit w-full mt-5 flex gap-3 justify-center'>
        <StatCard label={"Total Teachers"} value={stats.teachers} />
        <StatCard label={"Total Students"} value={stats.students} />
        <StatCard label={"Total Points Given"} value={stats.points} />
    </div>
  )
})


const StatCard = ({label, value}:{
    label:string,
    value:number
}) => {

    return <div className='p-4 bg-white shadow-md rounded-lg min-w-[200px]'>
        <h3 className='text-sm'>{label}</h3>
        <p className='text-xl font-semibold text-[#023d54]'>{value}</p>
    </div>
}

export default SchoolStats
