import { getCurrentUser, getRanks } from "@/api"
import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


const Ranks = () => {
    const [teacherRanks, setTeacherRanks] = useState<any[]>([])
    const [studentRanks, setStudentRanks] = useState<any[]>([])

  useEffect(()=>{
    const fetchRanks = async () => {
        const currUser = await getCurrentUser()
        const res = await getRanks()
        if(currUser.user.grade){
            
            setTeacherRanks(res.teachers.data.filter((t:any) =>(t.grade === currUser.user.grade)||t.grade=="N/A"))
            setStudentRanks(res.students.data)
        }else{
            setTeacherRanks(res.teachers.data)
            setStudentRanks(res.students.data)
        }
    }
    fetchRanks()
  },[])
  return (
    <div className="pt-10">
        <PointsBarChart data={teacherRanks} title="TOTAL POINTS ISSUED BY TEACHER" barColor="#bb45d9"/>
        <PointsBarChart data={studentRanks} title="TOTAL POINTS RECEIVED BY STUDENT" barColor="#1E90FF"/>
    </div>
  )
}



const PointsBarChart = ({ 
    data, 
    title, 
    barColor ,
}: { 
    data: any[], 
    title: string, 
    barColor: string ,
}) => {
    const [showData, setShowData] = useState(data);
    useEffect(() => {
        let d = data.sort((a,b) => b.totalPoints - a.totalPoints)
        
        setShowData(d);
    }, [data]);
    return (
    <div className="w-full grid grid-cols-8 place-items-center border-2 py-5 rounded-lg h-[400px]  mb-6 mt-10">
        <h2 className="text-wrap  text-sm col-span-8 px-4 flex flex-col items-center font-bold text-center mb-4"
        style={{color: barColor}}
        >
            {title}
        </h2>
        
        <ResponsiveContainer className={"col-span-8 "} width="100%" height={"100%"}>
            <BarChart
                data={showData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
                layout={'vertical'}  
                barGap={2}
            >
                <XAxis type="number"  tickLine={false}  />
                <YAxis dataKey="_id" type="category" orientation='left' fontSize={10}    />
                <Tooltip />
                <Bar dataKey="totalPoints" fill={barColor} barSize={30} background={{ fill: '#f5f5f5' }} label={{
        position: 'insideLeft',
        fill: '#0f0f0f',
        fontSize: 12
    }} />
            </BarChart>
        </ResponsiveContainer>
    </div>)
};

export default Ranks
