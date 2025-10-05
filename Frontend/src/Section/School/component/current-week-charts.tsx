import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { getStudents, getAnalyticsData } from "@/api"

interface CurrentWeekChartsProps {
  studentId: string
}

const CurrentWeekCharts = ({ studentId }: CurrentWeekChartsProps) => {
  const [weekData, setWeekData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [detailView, setDetailView] = useState<{
    type: 'awarded' | 'deducted' | 'withdrawn' | null;
    title: string;
    color: string;
  } | null>(null)
  const [period, setPeriod] = useState<string>("1W")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [selectedStudentName, setSelectedStudentName] = useState<string>("")
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [isPopOverOpen, setIsPopOverOpen] = useState(false)
  const [detailData, setDetailData] = useState<any>(null)

  useEffect(() => {
    fetchWeekData()
    fetchStudents()
  }, [studentId])

  const fetchStudents = async () => {
    const token = localStorage.getItem("token")
    const res = await getStudents(token ?? "")
    setStudents(res.students || [])
    setFilteredStudents(res.students || [])
  }

  const fetchWeekData = async () => {
    try {
      setLoading(true)
      console.log('📊 MAIN CHARTS: Fetching data for period: 1W, studentId:', studentId)

      const data = await getAnalyticsData({
        period: '1W',
        ...(studentId && { studentId })
      })

      console.log('📊 MAIN CHARTS: Received data:', data)

      if (data.success) {
        // Convert API data to chart format
        const awardMap = new Map(data.data.awardPoints.map((d: any) => [d.date, d.points]))
        const deductMap = new Map(data.data.deductPoints.map((d: any) => [d.date, d.points]))
        const withdrawMap = new Map(data.data.withdrawPoints.map((d: any) => [d.date, d.points]))

        // Get all unique dates from all three datasets
        const allDates = new Set([
          ...data.data.awardPoints.map((d: any) => d.date),
          ...data.data.deductPoints.map((d: any) => d.date),
          ...data.data.withdrawPoints.map((d: any) => d.date)
        ])

        const chartData = Array.from(allDates).sort().map(date => {
          const dateObj = new Date(date)
          return {
            day: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
            date,
            awarded: awardMap.get(date) || 0,
            deducted: deductMap.get(date) || 0,
            withdrawn: withdrawMap.get(date) || 0
          }
        })

        console.log('📊 MAIN CHARTS: Processed chart data:', chartData)
        setWeekData(chartData)
      }
    } catch (error) {
      console.error('Error fetching week data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('useEffect triggered - detailView:', detailView, 'period:', period, 'selectedStudent:', selectedStudent)
    if (detailView) {
      fetchDetailData()
    }
  }, [period, selectedStudent, detailView])

  const fetchDetailData = async () => {
    if (!detailView) return

    console.log('Fetching detail data with:', { period, selectedStudent, type: detailView.type })

    try {
      const data = await getAnalyticsData({
        period,
        ...(selectedStudent && { studentId: selectedStudent })
      })

      console.log('Analytics data received:', data)

      if (data.success) {
        let chartData = []
        if (detailView.type === 'awarded') {
          chartData = data.data.awardPoints
        } else if (detailView.type === 'deducted') {
          chartData = data.data.deductPoints
        } else if (detailView.type === 'withdrawn') {
          chartData = data.data.withdrawPoints
        }
        console.log('Setting chart data:', chartData)
        setDetailData(chartData)
      }
    } catch (error) {
      console.error("Error fetching detail data:", error)
    }
  }

  const processChartData = (data: any[], period: string) => {
    console.log('🔄 Processing chart data - Input:', data, 'Period:', period)
    if (!data || data.length === 0) {
      console.log('🔄 No data to process, returning empty array')
      return []
    }

    // Map the data to add formatted labels - ONLY show actual DB data
    const result = data.map((d: any) => ({
      ...d,
      label: formatDateLabel(d.date, period)
    }))

    console.log('🔄 Processed data (ONLY DB data):', result)
    return result
  }

  const formatDateLabel = (dateStr: string, period: string) => {
    const date = new Date(dateStr)

    if (period === "1W") {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else if (period === "1M") {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Points Overview - Current Week</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Individual Graphs - Each in separate row */}

      {/* Awarded Graph */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Points Awarded</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailView({ type: 'awarded', title: 'Points Awarded', color: '#10b981' })}
          >
            View Details
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="awarded" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Deducted Graph */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Points Deducted</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailView({ type: 'deducted', title: 'Points Deducted', color: '#ef4444' })}
          >
            View Details
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="deducted" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Withdrawn Graph */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Points Withdrawn</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailView({ type: 'withdrawn', title: 'Points Withdrawn', color: '#f59e0b' })}
          >
            View Details
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="withdrawn" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detail View Dialog */}
      <Dialog open={!!detailView} onOpenChange={() => setDetailView(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailView?.title} - Detailed View</DialogTitle>
          </DialogHeader>

          {detailView && (
            <div className="space-y-6">
              {/* Filters in Detail View */}
              <div className="flex gap-4 flex-wrap">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1W">Last Week</SelectItem>
                    <SelectItem value="1M">Last Month</SelectItem>
                    <SelectItem value="3M">Last 3 Months</SelectItem>
                    <SelectItem value="6M">Last 6 Months</SelectItem>
                    <SelectItem value="1Y">Last Year</SelectItem>
                  </SelectContent>
                </Select>

                {Array.isArray(students) && students.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedStudent || "all"}
                      onValueChange={(value) => {
                        console.log('🔥 Student selected:', value)
                        if (value === "all") {
                          setSelectedStudent("")
                          setSelectedStudentName("")
                        } else {
                          const student = students.find((s: any) => s._id === value)
                          setSelectedStudent(value)
                          setSelectedStudentName(student?.name || "")
                        }
                      }}
                    >
                      <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="All Students">
                          {selectedStudent && students.find((s: any) => s._id === selectedStudent)
                            ? `${students.find((s: any) => s._id === selectedStudent)?.name} (${students.find((s: any) => s._id === selectedStudent)?.grade})`
                            : "All Students"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Students</SelectItem>
                        {students.map((s: any) => (
                          <SelectItem key={s._id} value={s._id}>
                            {`${s.name} (${s.grade})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedStudent && (
                      <X
                        onClick={() => {
                          console.log('Clearing student selection')
                          setSelectedStudent("")
                          setSelectedStudentName("")
                        }}
                        className="h-4 w-4 cursor-pointer hover:opacity-70"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Detailed Chart */}
              <div className="border-2 rounded-lg p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={detailData ? processChartData(detailData, period) : []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      angle={period === "1W" ? 0 : -45}
                      textAnchor={period === "1W" ? "middle" : "end"}
                      height={period === "1W" ? 30 : 60}
                    />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar
                      dataKey="points"
                      fill={detailView.color}
                      radius={[4, 4, 0, 0]}
                      barSize={period === "1W" ? 40 : period === "1M" ? 20 : 15}
                      background={{ fill: "#f5f5f5" }}
                      label={{
                        position: "top",
                        fill: "#0f0f0f",
                        fontSize: 12
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CurrentWeekCharts
