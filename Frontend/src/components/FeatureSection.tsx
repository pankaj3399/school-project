import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { School, UserCheck, Award, Gift, BarChart } from 'lucide-react'

const features = [
  {
    title: 'School Management',
    description: 'School Admins can manage teachers and students.',
    icon: School,
  },
  {
    title: 'Point Assignment',
    description: 'Assign and withdraw points with easy-to-use forms.',
    icon: UserCheck,
  },
  {
    title: 'Teacher Rewards',
    description: 'Teachers can award points to students for achievements.',
    icon: Award,
  },
  {
    title: 'Student Redemption',
    description: 'Students can redeem points for exciting gifts.',
    icon: Gift,
  },
  {
    title: 'Personalized Dashboards',
    description: 'Role-specific dashboards for personalized insights.',
    icon: BarChart,
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
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

