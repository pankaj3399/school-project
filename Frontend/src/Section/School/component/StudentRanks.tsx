import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAnalyticsData } from "@/api";
import { XAxis, YAxis, Tooltip, Bar, BarChart } from "recharts";
import { IconAwardFilled } from "@tabler/icons-react";
import { Printer, X } from "lucide-react";

interface Student {
    name: string;
    totalPoints: number;
}

const StudenRanks = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const handlePrint = () => {
        if (printRef.current) {
            const printContents = printRef.current.innerHTML;
            const newWindow = window.open("", "", "width=800,height=600");
            if (newWindow) {
                newWindow.document.write(`
              <html>
                <head>
                  <title>Student Rankings</title>
                  <style>
                    body { font-family: sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background: #f5f5f5; }
                  </style>
                </head>
                <body>
                  ${printContents}
                </body>
              </html>
            `);
                newWindow.document.close();
                newWindow.focus();
                newWindow.print();
                newWindow.close();
            }
        }
    };


    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getAnalyticsData({ period: "1W" });

            if (data.success) {
                setStudents(data.data.studentRankings || []);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="pt-6">
                        <p>Loading...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div>
            <div className="flex gap-2">
                {/* Students Card */}
                <Card className="flex-1 h-[420px] flex flex-col" onClick={() => { setIsDialogOpen(true) }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <IconAwardFilled className="text-neutral-700 w-8 h-8" />
                            <CardTitle className="font-medium text-lg text-center">
                                Students - <div>Earned Tokens</div>
                            </CardTitle>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                            <BarChart
                                width={200}
                                height={students.length * 50}
                                data={students}
                                layout="vertical"
                                margin={{ top: 0, right: 10, left: 0, bottom: -10 }}
                                barCategoryGap={40}
                            >
                                <XAxis type="number" />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    className="text-xs"
                                    width={60}
                                />
                                <Tooltip itemStyle={{ fontSize: "12px" }} />
                                <Bar dataKey="totalPoints" fill="#22c55e" barSize={20} />
                            </BarChart>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            {isDialogOpen && <div className="absolute inset-0">
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
                    <div className="relative bg-neutral-100 rounded-2xl shadow-lg p-4">
                        <button
                            onClick={() => setIsDialogOpen(false)}
                            className="absolute top-4 left-4 text-neutral-600 hover:text-neutral-800"
                        >
                            <X />
                        </button>
                        <div>
                            <button onClick={handlePrint} className="flex justify-center items-center gap-1 absolute top-4 right-4 text-neutral-600 hover:text-neutral-800 border border-neutral-400 py-0.5 px-1 rounded-sm">
                                <Printer className="w-5 h-5 stroke-1.5" />
                                Print
                            </button>
                        </div>

                        <div className="mt-12 overflow-y-auto max-h-[320px]" style={{ scrollbarWidth: 'none' }} ref={printRef}>
                            <table className="min-w-full border border-neutral-200 rounded-md">
                                <thead className="bg-neutral-100">
                                    <tr>
                                        <th className="px-6 py-2 text-left text-sm font-semibold text-neutral-700">
                                            Rank
                                        </th>
                                        <th className="px-6 py-2 text-left text-sm font-semibold text-neutral-700">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-2 text-left text-sm font-semibold text-neutral-700">
                                            Total Points
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr
                                            key={index}
                                            className="border-t border-neutral-200 hover:bg-neutral-50"
                                        >
                                            <td className="px-6 py-2 text-sm text-neutral-700">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-2 text-sm text-neutral-800 font-medium">
                                                {student.name}
                                            </td>
                                            <td className="px-6 py-2 text-sm text-neutral-700">
                                                {student.totalPoints}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>}
        </div>
    );
};

export default StudenRanks;
