import { RegisterForm } from '../../components/register-form'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Megaforce</h1>
          <p className="text-gray-400">AI-Powered Social Media Management</p>
        </div>
        
        <RegisterForm />
        
        <div className="text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
