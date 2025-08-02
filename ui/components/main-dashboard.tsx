"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowUpRight, MessageSquare, ThumbsUp, ExternalLink, Sparkles, Clock } from "lucide-react"

const topPosts = [
  {
    id: 1,
    subreddit: "r/technology",
    title: "OpenAI announces GPT-5 with revolutionary capabilities",
    author: "u/techguru2024",
    score: 15420,
    comments: 892,
    timeAgo: "2h ago",
    priority: 1,
    url: "https://reddit.com/r/technology/post1",
    preview: "OpenAI has just announced GPT-5, claiming it represents a significant leap forward in AI capabilities...",
  },
  {
    id: 2,
    subreddit: "r/programming",
    title: "Why Rust is becoming the go-to language for system programming",
    author: "u/rustdev",
    score: 8934,
    comments: 456,
    timeAgo: "4h ago",
    priority: 2,
    url: "https://reddit.com/r/programming/post2",
    preview: "An in-depth analysis of Rust's memory safety features and performance benefits...",
  },
  {
    id: 3,
    subreddit: "r/MachineLearning",
    title: "New paper: Transformer architecture improvements show 40% efficiency gains",
    author: "u/mlresearcher",
    score: 12567,
    comments: 234,
    timeAgo: "1h ago",
    priority: 3,
    url: "https://reddit.com/r/MachineLearning/post3",
    preview: "Researchers at Stanford have published a new paper detailing architectural improvements...",
  },
  {
    id: 4,
    subreddit: "r/startups",
    title: "YC W24 Demo Day highlights: AI startups dominate",
    author: "u/startupnews",
    score: 6789,
    comments: 178,
    timeAgo: "3h ago",
    priority: 4,
    url: "https://reddit.com/r/startups/post4",
    preview: "Y Combinator's Winter 2024 Demo Day showcased an unprecedented number of AI-focused startups...",
  },
  {
    id: 5,
    subreddit: "r/investing",
    title: "NVIDIA stock hits new all-time high after earnings beat",
    author: "u/stocktrader",
    score: 9876,
    comments: 567,
    timeAgo: "5h ago",
    priority: 5,
    url: "https://reddit.com/r/investing/post5",
    preview: "NVIDIA's latest earnings report exceeded expectations, driving the stock to new heights...",
  },
]

export function MainDashboard() {
  const [selectedPost, setSelectedPost] = useState<(typeof topPosts)[0] | null>(null)

  if (selectedPost) {
    return <PostDetail post={selectedPost} onBack={() => setSelectedPost(null)} />
  }

  return (
    <div className="flex-1 flex">
      <div className="flex-1 p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Today's Top Posts</h2>
          <p className="text-gray-400">Prioritized posts from your tracked subreddits</p>
        </div>

        <div className="grid gap-4 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Posts</p>
                    <p className="text-2xl font-bold text-white">87</p>
                  </div>
                  <div className="text-green-400">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg Score</p>
                    <p className="text-2xl font-bold text-white">9.2K</p>
                  </div>
                  <div className="text-blue-400">
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Comments</p>
                    <p className="text-2xl font-bold text-white">2.3K</p>
                  </div>
                  <div className="text-purple-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Subreddits</p>
                    <p className="text-2xl font-bold text-white">8</p>
                  </div>
                  <div className="text-orange-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-240px)]">
          <div className="space-y-3">
            {topPosts.map((post) => (
              <Card
                key={post.id}
                className="bg-gray-800 border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors"
                onClick={() => setSelectedPost(post)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        #{post.priority}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {post.subreddit}
                      </Badge>
                      <span className="text-xs text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {post.timeAgo}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{post.title}</h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{post.preview}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <ThumbsUp className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-300">{post.score.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">{post.comments}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">by {post.author}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function PostDetail({ post, onBack }: { post: (typeof topPosts)[0]; onBack: () => void }) {
  const aiSuggestions = [
    {
      id: 1,
      type: "Insightful",
      content:
        "This is a fascinating development! The implications for enterprise software development could be huge. Has anyone here had experience implementing similar AI-driven solutions in production environments?",
      confidence: 92,
    },
    {
      id: 2,
      type: "Question",
      content:
        "Great post! I'm curious about the technical implementation details. Are there any open-source alternatives or similar approaches that the community has experimented with?",
      confidence: 87,
    },
    {
      id: 3,
      type: "Supportive",
      content:
        "Thanks for sharing this! The timing couldn't be better as our team is evaluating similar technologies. Would love to hear more about real-world performance metrics if anyone has data to share.",
      confidence: 89,
    },
  ]

  return (
    <div className="flex-1 p-4">
      <div className="mb-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back to Dashboard
        </Button>
        <div className="flex items-center space-x-3 mb-2">
          <Badge variant="outline">#{post.priority}</Badge>
          <Badge variant="secondary">{post.subreddit}</Badge>
          <span className="text-sm text-gray-400">{post.timeAgo}</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Post Content</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-gray-300 leading-relaxed mb-4">{post.preview}</p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                ex ea commodo consequat.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
                laborum.
              </p>
              <div className="mt-6 pt-4 border-t border-gray-700">
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white bg-transparent"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Original Post on Reddit
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-400" />
                AI Comment Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-3 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.type}
                      </Badge>
                      <span className="text-xs text-gray-400">{suggestion.confidence}% confidence</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">{suggestion.content}</p>
                    <Button size="sm" variant="secondary" className="w-full">
                      Use This Comment
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Post Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Score</span>
                <div className="flex items-center space-x-2">
                  <ThumbsUp className="w-4 h-4 text-green-400" />
                  <span className="text-white font-semibold">{post.score.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Comments</span>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-semibold">{post.comments}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Author</span>
                <span className="text-white">{post.author}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Priority Rank</span>
                <Badge variant="outline">#{post.priority}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Engagement Rate</span>
                <span className="text-green-400 font-semibold">94.2%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white bg-transparent"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Reddit
              </Button>
              <Button variant="secondary" className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate More Comments
              </Button>
              <Button variant="ghost" className="w-full">
                Mark as Reviewed
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Subreddit Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Today's Posts</span>
                <span className="text-white">10</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Avg Score</span>
                <span className="text-white">12.4K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Top Performer</span>
                <span className="text-green-400">This Post</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
