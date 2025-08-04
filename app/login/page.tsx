import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-alliance-light-gray flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center shadow-lg p-4">
            <img 
              src="https://ieiuhdxdziszeabilnxp.supabase.co/storage/v1/object/public/media//Alliance-Logo%20(3).png"
              alt="Alliance Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#1B4278]">
          Alliance Hub
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Test Accounts</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p><strong>CEO:</strong> john.smith@alliancemobile.com</p>
              <p><strong>Manager:</strong> jane.doe@alliancemobile.com</p>
              <p><strong>Employee:</strong> alice.williams@alliancemobile.com</p>
              <p className="text-xs text-gray-500 mt-2">Default password: password123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}