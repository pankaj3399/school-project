import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const testimonials = [
  {
    quote: "PointEdu has revolutionized our school's reward system. Students are more engaged than ever!",
    author: "Jane Doe",
    role: "Principal, XYZ School",
  },
  {
    quote: "The ease of assigning points has made recognizing student achievements a breeze.",
    author: "John Smith",
    role: "Teacher, ABC High School",
  },
  {
    quote: "Our students love the reward system. It's boosted motivation and participation across the board.",
    author: "Emily Brown",
    role: "School Counselor, 123 Academy",
  },
]

const schoolLogos = [
  "https://png.pngtree.com/png-clipart/20211017/original/pngtree-school-logo-png-image_6851480.png",
  "https://png.pngtree.com/png-clipart/20230623/original/pngtree-school-logo-design-template-vector-png-image_9204124.png",
  "https://5.imimg.com/data5/SELLER/Default/2023/11/359234530/ZY/EX/YN/104169846/school-logo.png",
  "https://sts-school.edu.in/images/school-logo.png",
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Schools Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{testimonial.author}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">&quot;{testimonial.quote}&quot;</p>
                <p className="text-sm text-gray-600">{testimonial.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 flex justify-center items-center gap-2">
          <h3 className="text-xl font-semibold mb-4">Trusted by leading schools</h3>
          <div className="flex space-x-4">
            {schoolLogos.map((logo, index) => (
              <div key={index} className="w-16 h-16 bg-gray-200 rounded-full">
                <img src={logo} alt={`School Logo ${index + 1}`} className="w-full h-full object-contain" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
