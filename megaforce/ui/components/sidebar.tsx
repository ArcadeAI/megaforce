"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Settings, TrendingUp, Users, BarChart3, Target } from "lucide-react"

const subreddits = [
  { name: "r/technology", posts: 10, priority: "high" },
  { name: "r/programming", posts: 8, priority: "medium" },
  { name: "r/MachineLearning", posts: 10, priority: "high" },
  { name: "r/startups", posts: 6, priority: "medium" },
  { name: "r/investing", posts: 10, priority: "high" },
  { name: "r/webdev", posts: 7, priority: "medium" },
  { name: "r/artificial", posts: 9, priority: "high" },
  { name: "r/entrepreneur", posts: 5, priority: "low" },
]

export function Sidebar() {
  const [activeSection, setActiveSection] = useState("dashboard")

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Reddit Agent</h1>
        <p className="text-sm text-gray-400 mt-1">Subreddit Management</p>
      </div>

      <div className="p-3 space-y-2">
        <Button
          variant={activeSection === "dashboard" ? "secondary" : "ghost"}
          className="w-full justify-start text-left"
          onClick={() => setActiveSection("dashboard")}
        >
          <BarChart3 className="w-4 h-4 mr-3" />
          Dashboard
        </Button>
        <Button
          variant={activeSection === "subreddits" ? "secondary" : "ghost"}
          className="w-full justify-start text-left"
          onClick={() => setActiveSection("subreddits")}
        >
          <Users className="w-4 h-4 mr-3" />
          Subreddits
        </Button>
        <Button
          variant={activeSection === "analytics" ? "secondary" : "ghost"}
          className="w-full justify-start text-left"
          onClick={() => setActiveSection("analytics")}
        >
          <TrendingUp className="w-4 h-4 mr-3" />
          Analytics
        </Button>
        <Button
          variant={activeSection === "settings" ? "secondary" : "ghost"}
          className="w-full justify-start text-left"
          onClick={() => setActiveSection("settings")}
        >
          <Settings className="w-4 h-4 mr-3" />
          Settings
        </Button>
      </div>

      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Tracked Subreddits</h3>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-1">
            {subreddits.map((subreddit) => (
              <div
                key={subreddit.name}
                className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{subreddit.name}</span>
                  <Badge
                    variant={
                      subreddit.priority === "high"
                        ? "default"
                        : subreddit.priority === "medium"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {subreddit.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{subreddit.posts} posts today</span>
                  <Target className="w-3 h-3 text-green-400" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
