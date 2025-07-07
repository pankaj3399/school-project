
export default function VideoSection() {
  return (
    <section id='videos' className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Watch Our Videos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Video 1 */}
          <div className="bg-gray-50 rounded-lg shadow-lg flex flex-col items-center p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">Meet Nancy Radu</h3>
            <div className="w-full aspect-video rounded-lg overflow-hidden mb-4">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/a14XM-NDKow?si=EDDb-Lg17F7CaHaP"
                title="Meet Nancy Radu"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
          {/* Video 2 */}
          <div className="bg-gray-50 rounded-lg shadow-lg flex flex-col items-center p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">The Radu E-Token</h3>
            <div className="w-full aspect-video rounded-lg overflow-hidden mb-4">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/zoY2iwvKTJw?si=VjVV-pbKYEniW57C"
                title="The Radu E-Token"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
