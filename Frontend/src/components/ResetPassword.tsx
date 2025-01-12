import React, { useState } from 'react'
import Header from './Header'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from 'react-router-dom'
import { resetPassword } from '@/api'
import { useToast } from '@/hooks/use-toast'
import { useOtpContext } from './OtpContextProvider'



export  const ResetPassword = ()=> {
  const {email, role, otpId} = useOtpContext()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    password: ''

  })
  const [errors, setErrors] = useState({
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    validateField(name, value)
  }


  const validateField = (name: string, value: string) => {
    let error = ''
    switch (name) {
      case 'name':
        error = value.trim() === '' ? 'Name is required' : ''
        break
      case 'email':
        error = !/\S+@\S+\.\S+/.test(value) ? 'Invalid email format' : ''
        break
      case 'password':
        error = value.length < 6 ? 'Password must be at least 6 characters' : ''
        break
      case 'role':
        error = value === '' ? 'Please select a role' : ''
        break
      default:
        break
    }
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    Object.keys(formData).forEach(key => validateField(key, formData[key as keyof typeof formData]))
    if (Object.values(errors).every(error => error === '')) {
      setLoading(true)
      try {
        const res = await resetPassword({
            email, role, otpId, password: formData.password
        })
        if (res.error) {
          toast({
            title: "Error in reseting",
            description: "Something went wrong!",
            variant: "destructive"
          })
        } else {
          navigate("/signin")
        }
      } catch (error) {
        console.error("Reset error:", error)
        toast({
          title: "Reset failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white py-44 px-4 sm:px-6 lg:px-8">
      <Header />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  className="w-full pr-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby="password-error"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500" id="password-error">{errors.password}</p>}
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
            >
              {loading ? 'Loading...' : 'Set New Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
