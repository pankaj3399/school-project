import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Award, Gift } from 'lucide-react'

const steps = [
  {
    title: 'System Manager Sign Up',
    description: 'System Managers set up the classroom/unit. (Rosters and Forms).',
    icon: UserPlus,
  },
  {
    title: 'Teachers/Team members assign E-Tokens',
    description: 'Teachers/Team members assign E-Tokens to students.',
    icon: Award,
  },
  {
    title: 'Students Redeem E-Tokens',
    description: 'Students purchase highly reinforcing items from the E-Token Store.',
    icon: Gift,
  },
]

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-8">
          {steps.map((step, index) => (
            <Card key={index} className="w-full md:w-1/3">
              <CardHeader>
                <CardTitle className="flex flex-col items-center text-center">
                  <step.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <span>{step.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}