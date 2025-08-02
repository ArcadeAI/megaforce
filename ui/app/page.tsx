import { Sidebar } from "@/components/sidebar"
import { TwitterDashboard } from "@/components/twitter-dashboard"

export default function HomePage() {
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-scroll">
      <Sidebar />
      <TwitterDashboard />
    </div>
  )
}
