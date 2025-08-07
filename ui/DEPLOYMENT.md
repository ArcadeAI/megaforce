# Megaforce UI - Heroku Deployment Guide

This guide will help you deploy the Megaforce UI to Heroku, keeping it in the same ecosystem as your API backend.

## Prerequisites

- Heroku CLI installed
- Git repository
- Your API backend already deployed on Heroku: `https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com/`

## Deployment Steps

### 1. Create Heroku App

```bash
# Navigate to UI directory
cd ui

# Create new Heroku app
heroku create megaforce-ui

# Or use a specific name
heroku create your-app-name-ui
```

### 2. Set Environment Variables

```bash
# Set the API base URL to point to your existing backend
heroku config:set NEXT_PUBLIC_API_BASE_URL=https://megaforce-api-1753594244-73541ebdaf5f.herokuapp.com

# Set Node.js buildpack
heroku buildpacks:set heroku/nodejs
```

### 3. Deploy

```bash
# Add Heroku remote (if not done automatically)
heroku git:remote -a your-app-name-ui

# Deploy
git add .
git commit -m "Deploy Megaforce UI to Heroku"
git push heroku main
```

### 4. Open Your App

```bash
heroku open
```

## Environment Variables

The following environment variables are automatically set:

- `NEXT_PUBLIC_API_BASE_URL` - Points to your existing API backend
- `NODE_ENV` - Set to "production" by Heroku
- `PORT` - Set by Heroku for the web process

## Build Process

Heroku will automatically:
1. Install dependencies with `npm install`
2. Run `npm run build` (Next.js build)
3. Start the app with `npm start`

## Monitoring

- **Logs**: `heroku logs --tail`
- **App Info**: `heroku apps:info`
- **Dyno Status**: `heroku ps`

## Custom Domain (Optional)

```bash
# Add custom domain
heroku domains:add yourdomain.com

# Configure DNS to point to Heroku
# CNAME: yourdomain.com -> your-app-name-ui.herokuapp.com
```

## Troubleshooting

### Build Failures
```bash
# Check build logs
heroku logs --tail

# Common fixes:
# 1. Ensure package.json has correct Node.js version
# 2. Check for dependency conflicts
# 3. Verify environment variables are set
```

### Runtime Issues
```bash
# Check if app is running
heroku ps

# Restart app
heroku restart

# Check environment variables
heroku config
```

## Architecture

```
User Browser
    ↓
Megaforce UI (Heroku)
    ↓ API calls
Megaforce API (Heroku) ← Your existing backend
    ↓
Supabase Database
```

## Benefits of Heroku Deployment

- **Same Ecosystem**: Both UI and API on Heroku
- **Easy Management**: Single platform for monitoring
- **Automatic HTTPS**: SSL certificates included
- **Scalability**: Easy to scale dynos
- **CI/CD Ready**: Integrates with GitHub for auto-deployment

## Next Steps

1. Deploy the UI to Heroku
2. Test the full authentication flow
3. Verify API integration works
4. Set up GitHub integration for auto-deployment
5. Configure custom domain if needed

Your Megaforce social media management system will then be fully deployed and accessible!
