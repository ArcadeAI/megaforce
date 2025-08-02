import { Sidebar } from "@/components/sidebar"
import { MainDashboard } from "@/components/main-dashboard"

export default function HomePage() {
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-scroll">
      <Sidebar />
      <MainDashboard />
    </div>
  )
}
