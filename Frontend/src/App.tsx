import RootLayout from "./layout"
import LandingPage from "./Section/LandingPage"
import SignupForm from "./components/SignupPage"
import {   Route, Routes } from "react-router-dom"
import LoginForm from "./components/SigninPage"
import Dashboard from "./components/Dashboard"
export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <RootLayout >
        <Routes>
        <Route path="/" element = {<LandingPage />} />
          <Route path="/signup" element={<SignupForm/>} />
          <Route path="/signin" element={<LoginForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      </RootLayout>
    </div>
  )
}
