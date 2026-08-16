import Header from './Header'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from 'react-router-dom'

export const SignupForm = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white py-44 px-4 sm:px-6 lg:px-8">
      <Header />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Invitation only</CardTitle>
          <CardDescription className="text-center">
            Accounts are created by an administrator. If you received an invite email, use that link to set up your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold">
            <Link to="/signin">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
