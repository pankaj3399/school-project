//school/component
import { memo } from "react"


const SchoolStats = memo(({stats}:{
  stats:{
    teachers: number;
    students: number;
    points: number;
    oopsie: number;
    feedbacks: number;
}
}) => {
  
  return (
    <div className='h-fit w-full mt-5 flex gap-2 justify-center flex-wrap'>
        <StatCard label={"Total Teachers"} value={stats.teachers} />
        <StatCard label={"Total Students"} value={stats.students} />
        <StatCard label={"Awarded Points"} value={stats.points} />
        <StatCard label={"Feedbacks"} value={stats.feedbacks} />
        <StatCard label={"Total Oopsies"} value={stats.oopsie} />
        <StatCard label={"Average Points"} value={Math.floor(stats.points/stats.students)} />

    </div>
  )
})


const StatCard = ({label, value}:{
    label:string,
    value:number
}) => {

    return <div className='p-4 bg-white shadow-md rounded-lg min-w-[150px] text-center'>
        <h3 className='text-sm'>{label}</h3>
        <p className='text-xl font-semibold text-[#023d54]'>{value}</p>
    </div>
}

export default SchoolStats