"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowUpRight, MessageSquare, Heart, ExternalLink, Clock, Twitter, TrendingUp, User } from "lucide-react"
import { apiClient } from "./api-client"

// Types for Twitter data
interface Tweet {
  id: string
  text: string
  author: {
    username: string
    name: string
    profile_image_url?: string
  }
  public_metrics: {
    retweet_count: number
    like_count: number
    reply_count: number
    quote_count: number
  }
  created_at: string
  search_query?: string
  url?: string
}

// Sample tweets for fallback/development using "the_dog" user context
function getSampleTweets(): Tweet[] {
  return [
    {
      id: "1",
      text: "Just shipped a new AI feature that automatically generates social media content for our clients. The engagement rates are through the roof! 🚀 #AI #SocialMedia #Megaforce",
      author: {
        username: "the_dog",
        name: "Theo (The Dog)",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar.jpg"
      },
      public_metrics: {
        retweet_count: 45,
        like_count: 234,
        reply_count: 12,
        quote_count: 8
      },
      created_at: "2024-01-15T10:30:00Z",
      search_query: "AI OR social media OR automation",
      url: "https://twitter.com/the_dog/status/1"
    },
    {
      id: "2", 
      text: "Building in public: Our social media management platform now integrates with Twitter API v2. Real-time sentiment analysis and automated responses are game changers! 🧵",
      author: {
        username: "startup_founder",
        name: "Sarah Chen",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567891/avatar.jpg"
      },
      public_metrics: {
        retweet_count: 89,
        like_count: 567,
        reply_count: 34,
        quote_count: 23
      },
      created_at: "2024-01-15T09:15:00Z",
      search_query: "AI OR social media OR automation",
      url: "https://twitter.com/startup_founder/status/2"
    },
    {
      id: "3",
      text: "The intersection of AI and social media management is fascinating. We're seeing 300% improvement in engagement when using AI-generated content vs manual posts.",
      author: {
        username: "ai_researcher",
        name: "Dr. Alex Kim",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567892/avatar.jpg"
      },
      public_metrics: {
        retweet_count: 156,
        like_count: 892,
        reply_count: 67,
        quote_count: 34
      },
      created_at: "2024-01-15T08:45:00Z",
      search_query: "AI OR social media OR automation",
      url: "https://twitter.com/ai_researcher/status/3"
    }
  ]
}

export function TwitterDashboard() {
  const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null)
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSampleData = () => {
      try {
        setLoading(true)
        // Use sample data for now - real API calls will be made from dedicated search forms
        // that include all required parameters (credentials, search params, etc.)
        setTweets(getSampleTweets())
      } finally {
        setLoading(false)
      }
    }
    
    loadSampleData()
  }, [])

  if (selectedTweet) {
    return <TweetDetail tweet={selectedTweet} onBack={() => setSelectedTweet(null)} />
  }

  return (
    <div className="flex-1 flex">
      <div className="flex-1 p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Latest Tweets</h2>
          <p className="text-gray-400">Recent tweets from your tracked searches • Connected as: the_dog</p>
        </div>

        <div className="grid gap-4 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Tweets</p>
                    <p className="text-2xl font-bold text-white">{tweets.length}</p>
                  </div>
                  <div className="text-blue-400">
                    <Twitter className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Avg Likes</p>
                    <p className="text-2xl font-bold text-white">{Math.round(tweets.reduce((acc, tweet) => acc + tweet.public_metrics.like_count, 0) / tweets.length) || 0}</p>
                  </div>
                  <div className="text-red-400">
                    <Heart className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Replies</p>
                    <p className="text-2xl font-bold text-white">{tweets.reduce((acc, tweet) => acc + tweet.public_metrics.reply_count, 0)}</p>
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
                    <p className="text-sm text-gray-400">Active Searches</p>
                    <p className="text-2xl font-bold text-white">3</p>
                  </div>
                  <div className="text-orange-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-240px)]">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-gray-400 py-8">
                <Twitter className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                Loading tweets...
              </div>
            ) : tweets.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Twitter className="w-8 h-8 mx-auto mb-2" />
                No tweets found
              </div>
            ) : (
              tweets.map((tweet) => (
                <Card
                  key={tweet.id}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors"
                  onClick={() => setSelectedTweet(tweet)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="text-xs bg-blue-600">
                          @{tweet.author.username}
                        </Badge>
                        <span className="text-xs text-gray-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(tweet.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); window.open(tweet.url, '_blank'); }}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-white mb-3 line-clamp-3">{tweet.text}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4 text-red-400" />
                          <span className="text-sm text-gray-300">{tweet.public_metrics.like_count.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-300">{tweet.public_metrics.reply_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ArrowUpRight className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">{tweet.public_metrics.retweet_count}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{tweet.author.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function TweetDetail({ tweet, onBack }: { tweet: Tweet; onBack: () => void }) {
  return (
    <div className="flex-1 p-4">
      <div className="mb-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back to Dashboard
        </Button>
        <div className="flex items-center space-x-3 mb-2">
          <Badge variant="secondary" className="bg-blue-600">@{tweet.author.username}</Badge>
          <span className="text-sm text-gray-400 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {new Date(tweet.created_at).toLocaleString()}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">{tweet.author.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Tweet Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">{tweet.text}</p>
              
              <div className="flex items-center space-x-6 mb-4">
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span className="text-white font-semibold">{tweet.public_metrics.like_count.toLocaleString()}</span>
                  <span className="text-gray-400">likes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-semibold">{tweet.public_metrics.reply_count}</span>
                  <span className="text-gray-400">replies</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ArrowUpRight className="w-5 h-5 text-green-400" />
                  <span className="text-white font-semibold">{tweet.public_metrics.retweet_count}</span>
                  <span className="text-gray-400">retweets</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => window.open(tweet.url, '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Twitter
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">AI Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                <User className="w-4 h-4 mr-2" />
                Generate Reply
              </Button>
              <Button variant="outline" className="w-full">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyze Sentiment
              </Button>
              <Button variant="outline" className="w-full">
                <Twitter className="w-4 h-4 mr-2" />
                Add to Queue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
