export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-gray-900 mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
        <p>At Trend Mart, we respect your privacy and are committed to protecting your personal data.</p>
        
        <h2 className="text-lg font-bold text-gray-800 mt-4">1. Information We Collect</h2>
        <p>When you register, post ads, or interact with our directory, we may collect your email address, phone number, and location details.</p>
        
        <h2 className="text-lg font-bold text-gray-800 mt-4">2. How We Use Information</h2>
        <p>Your data is used to provide, maintain, and improve our classified and manpower services, as well as to communicate important updates regarding your account.</p>
        
        <h2 className="text-lg font-bold text-gray-800 mt-4">3. Data Security</h2>
        <p>We implement secure authentication and database protocols (via Supabase) to ensure your information remains safe and protected.</p>
      </div>
    </div>
  )
}