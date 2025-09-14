import { getCurrentUser, getRanks } from "@/api"
import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PrinterIcon } from "lucide-react";


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
    const [isTableOpen, setIsTableOpen] = useState(false);

    useEffect(() => {
        let d = data.sort((a,b) => b.totalPoints - a.totalPoints)

        setShowData(d);
    }, [data]);

    const handlePrint = () => {
        const printContent = document.getElementById('data-table');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload();
        }
    };
    return (
    <div className="w-full grid grid-cols-8 place-items-center border-2 py-5 rounded-lg h-[400px] mb-6 mt-10">
        <h2 className="text-wrap text-sm col-span-8 px-4 flex flex-col items-center font-bold text-center mb-4"
            style={{color: barColor}}
        >
            {title}
        </h2>

        <div className="col-span-8 w-full h-full cursor-pointer" onClick={() => setIsTableOpen(true)}>
            <ResponsiveContainer width="100%" height="100%">
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
                    <XAxis type="number" tickLine={false} />
                    <YAxis dataKey="_id" type="category" orientation='left' fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="totalPoints" fill={barColor} barSize={30} background={{ fill: '#f5f5f5' }} label={{
                        position: 'insideLeft',
                        fill: '#0f0f0f',
                        fontSize: 12
                    }} />
                </BarChart>
            </ResponsiveContainer>
        </div>

        {/* Pop-up Table Dialog */}
        <Dialog open={isTableOpen} onOpenChange={setIsTableOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>{title}</DialogTitle>
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <PrinterIcon className="h-4 w-4" />
                        Print
                    </Button>
                </DialogHeader>
                <div id="data-table" className="print:p-4">
                    <div className="print:block hidden mb-4 text-center">
                        <h1 className="text-xl font-bold">{title}</h1>
                        <p className="text-sm text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Rank</TableHead>
                                <TableHead>Name</TableHead>
                                {title.includes('TEACHER') && <TableHead>Grade</TableHead>}
                                <TableHead className="text-right">Total Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {showData.map((item, index) => (
                                <TableRow key={item._id}>
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{item._id}</TableCell>
                                    {title.includes('TEACHER') && (
                                        <TableCell>{item.grade || 'N/A'}</TableCell>
                                    )}
                                    <TableCell className="text-right">{item.totalPoints}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    </div>)
};

export default Ranks
