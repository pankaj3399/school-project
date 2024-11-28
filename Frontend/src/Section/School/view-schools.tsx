import { useEffect, useState } from "react"
// import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { getCurrrentSchool } from "@/api"
import Loading from "../Loading"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
export default function ViewSchools() {
  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()
  useEffect(() => {
    const fetchSchool = async () => {
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

        const data = await getCurrrentSchool(token)
        setSchool(data.school)
        setLoading(false)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch school data.",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchSchool()
  }, [toast])

  if (loading) {
    return <Loading />
  }

  if (!school) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">No school found</h1>
        <p>Please ensure you have access to a school and try again.</p>
      </div>
    )
  }

  return (
    <div className="grid place-items-center">
      {/* <h1 className="text-3xl font-bold mb-6">View School</h1> */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 items-center space-x-4">
          <img
            src={school.logo || "/default-logo.png"}
            alt={school.name}
            className="w-72 h-72 object-cover rounded-full"
          />
          <div className="text-center">
            <h2 className="text-4xl font-bold">Schoolname: {school.name}</h2>
            <p className="text-xl">Address: {school.address}</p>
          </div>
          <div className="flex gap-4">
            <Button variant={"outline"} onClick={()=> navigate("/addteacher")}>Add Teacher</Button>
            <Button variant={"outline"} onClick={()=> navigate("/viewstudent")}>View Teacher</Button>
            <Button variant={"outline"} onClick={()=> navigate("/addstudent")}>Add Students</Button>
            <Button variant={"outline"} onClick={()=> navigate("/viewstudent")}>View Students</Button>
          </div>
        </div>
      </div>
      {/* <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Address</TableCell>
            <TableCell>Logo</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow key={school.id}>
            <TableCell>{school.name}</TableCell>
            <TableCell>{school.address}</TableCell>
            <TableCell>
              <img
                src={school.logo || "/default-logo.png"}
                alt={school.name}
                className="w-12 h-12 object-cover rounded"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table> */}
    </div>
  )
}
