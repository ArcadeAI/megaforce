"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowUpRight, MessageSquare, Heart, ExternalLink, Clock, Twitter, TrendingUp } from "lucide-react"
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

interface TwitterSearchResult {
  query: string
  tweets: Tweet[]
  total_count: number
}

// Default user for development - using "the_dog" as specified
const DEFAULT_USER = {
  username: "the_dog",
  token: "dev-token-for-the-dog" // This will be replaced with real auth
}

// Sample tweets for fallback/development
function getSampleTweets(): Tweet[] {
  return [
    {
      id: "1",
      text: "Just shipped a new AI feature that automatically generates social media content. The future is here! 🚀 #AI #tech",
      author: {
        username: "techfounder",
        name: "Tech Founder",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567890/avatar.jpg"
      },
      public_metrics: {
        retweet_count: 45,
        like_count: 234,
        reply_count: 12,
        quote_count: 8
      },
      created_at: "2024-01-15T10:30:00Z",
      search_query: "AI OR tech OR startup",
      url: "https://twitter.com/techfounder/status/1"
    },
    {
      id: "2",
      text: "Building in public: Our startup just raised $2M seed round! Here's what we learned during the fundraising process 🧵",
      author: {
        username: "startup_ceo",
        name: "Startup CEO",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567891/avatar.jpg"
      },
      public_metrics: {
        retweet_count: 89,
        like_count: 567,
        reply_count: 34,
        quote_count: 23
      },
      created_at: "2024-01-15T09:15:00Z",
      search_query: "AI OR tech OR startup",
      url: "https://twitter.com/startup_ceo/status/2"
    },
    {
      id: "3",
      text: "The intersection of AI and social media is fascinating. We're seeing unprecedented engagement rates with AI-generated content.",
      author: {
        username: "ai_researcher",
        name: "AI Researcher",
        profile_image_url: "https://pbs.twimg.com/profile_images/1234567892/avatar.jpg"
      },
      public_metrics: {
        retweet_count: 23,
        like_count: 156,
        reply_count: 18,
        quote_count: 5
      },
      created_at: "2024-01-15T08:45:00Z",
      search_query: "AI OR tech OR startup",
      url: "https://twitter.com/ai_researcher/status/3"
    }
  ]
}

export function MainDashboard() {
  const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null)
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        setLoading(true)
        // Use the existing Twitter search endpoint with "the_dog" user data
        const searchResult = await apiClient.searchTwitter({
          search_type: "keywords",
          search_query: "AI OR tech OR startup",
          limit: 10
        })
        
        // Transform API response to our Tweet interface
        const transformedTweets: Tweet[] = searchResult.data?.map((tweet: any, index: number) => ({
          id: tweet.id || `tweet-${index}`,
          text: tweet.text || tweet.full_text || "No content available",
          author: {
            username: tweet.author?.username || tweet.user?.screen_name || "unknown",
            name: tweet.author?.name || tweet.user?.name || "Unknown User",
            profile_image_url: tweet.author?.profile_image_url || tweet.user?.profile_image_url
          },
          public_metrics: {
            retweet_count: tweet.public_metrics?.retweet_count || tweet.retweet_count || 0,
            like_count: tweet.public_metrics?.like_count || tweet.favorite_count || 0,
            reply_count: tweet.public_metrics?.reply_count || tweet.reply_count || 0,
            quote_count: tweet.public_metrics?.quote_count || tweet.quote_count || 0
          },
          created_at: tweet.created_at || new Date().toISOString(),
          search_query: "AI OR tech OR startup",
          url: tweet.url || `https://twitter.com/${tweet.author?.username || 'unknown'}/status/${tweet.id}`
        })) || []
        
        setTweets(transformedTweets)
      } catch (error) {
        console.error('Failed to fetch tweets:', error)
        // Fallback to sample data for development
        setTweets(getSampleTweets())
      } finally {
        setLoading(false)
      }
    }
    
    fetchTweets()
  }, [])

  if (selectedTweet) {
    return <TweetDetail tweet={selectedTweet} onBack={() => setSelectedTweet(null)} />
  }

  return (
    <div className="flex-1 flex">
      <div className="flex-1 p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Latest Tweets</h2>
          <p className="text-gray-400">Recent tweets from your tracked searches</p>
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
                    <p className="text-sm text-gray-400">Replies</p>
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
                    <p className="text-sm text-gray-400">Searches</p>
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
