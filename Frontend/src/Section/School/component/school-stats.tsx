//school/component
import { memo, ReactNode } from "react"
import { IconAppleFilled, IconAwardFilled, IconMessageFilled, IconUsers, IconAlertTriangle, IconShoppingCart,  } from '@tabler/icons-react'; 

const SchoolStats = memo(({stats}:{
  stats:{
    teachers: number;
    students: number;
    points: number;
    oopsie: number;
    feedbacks: number;
    withdrawals: number;
}
}) => {
  
  return (
    <div className='h-fit w-full mt-5 flex gap-2 justify-center flex-wrap'>
        <StatCard label={"Total Teachers"} value={stats.teachers} Icon={IconAppleFilled}/>
        <StatCard label={"Total Students"} value={stats.students} Icon={IconUsers}/>
        <StatCard label={"Awarded Points"} value={stats.points} Icon={IconAwardFilled} />
        <StatCard label={"Feedbacks"} value={stats.feedbacks} Icon={IconMessageFilled}/>
        <StatCard label={"Total Oopsies"} value={stats.oopsie} Icon={IconAlertTriangle}/>
        <StatCard label={"Withdrawals"} value={stats.withdrawals} Icon={IconShoppingCart}/>

    </div>
  )
})


const StatCard = ({label, value, Icon }:{
    label:string,
    value:number,
    Icon: React.ElementType,
}) => {

    return <div className='p-4 bg-white shadow-md rounded-lg min-w-[190px] text-center'>
        <Icon className="mx-auto mb-1 text-[#023d54]" />
        <h3 className='text-sm'>{label}</h3>
        <p className='text-xl font-semibold text-[#023d54]'>{value}</p>
    </div>
}

export default SchoolStats
