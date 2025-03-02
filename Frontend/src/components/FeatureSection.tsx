import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { School, UserCheck, Award, Gift, BarChart, Target } from 'lucide-react'

const features = [
  {
    title: 'System Management',
    description: 'System manager can set up participants and forms.',
    icon: School,
  },
  {
    title: 'E-Token Assignment',
    description: 'Easy to create and use E-Token forms.',
    icon: UserCheck,
  },
  {
    title: 'Automatic Analytics',
    description: 'Automatic raw data collection and interactive analytics.',
    icon: Award,
  },
  {
    title: 'Student Redemption',
    description: 'Students can redeem E-Tokens for Exciting gifts.',
    icon: Gift,
  },
  {
    title: 'Personalized Dashboards',
    description: 'Role-specific dashboards for personalized insights.',
    icon: BarChart,
  },
  {
    title: 'Compliance Certified',
    description: 'Aligned with FERPA, COPPA, CIPA, DPAs, and other educational regulations.',
    icon: Target,
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-4  bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                  <span>{feature.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}