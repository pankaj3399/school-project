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
              <video
                src="/Meet_Nancy_Radu.mp4"
                controls
                controlsList="nodownload"
                className="w-full h-full object-cover rounded-lg"
                title="Meet Nancy Radu"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          {/* Video 2 */}
          <div className="bg-gray-50 rounded-lg shadow-lg flex flex-col items-center p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">The Radu E-Token</h3>
            <div className="w-full aspect-video rounded-lg overflow-hidden mb-4">
              <video
                src="/The_Radu_E-Token.mp4"
                controls
                controlsList="nodownload"
                className="w-full h-full object-cover rounded-lg"
                title="The Radu E-Token"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
