import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getTeachers } from "@/api"
import Loading from "../Loading"

export default function ViewTeachers() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          toast({
            title: "Error",
            description: "No token found.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        const data = await getTeachers(token)
        setTeachers(data.teachers)
        setLoading(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch teacher data.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchTeachers()
  }, [toast])

  if (loading) {
    return <Loading />
  }

  if (teachers.length === 0) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">No teachers found</h1>
        <p>Please ensure there are teachers in the system and try again.</p>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white rounded-xl shadow-xl mt-10">
      <h1 className="text-3xl font-bold mb-6">View Teachers</h1>
      <Table >
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Subject</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow key={teacher._id}>
              <TableCell>{teacher.name}</TableCell>
              <TableCell>{teacher.subject}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
