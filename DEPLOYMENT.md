# Driflly Deployment Guide

This guide covers deploying Driflly to production environments including Render for the backend and Vercel for the frontend.

## Backend Deployment on Render

### Prerequisites

Before deploying, ensure you have a Render account and your code is pushed to a GitHub repository. The backend requires Python 3.13 and uses SQLite for data storage, which works well with Render's ephemeral filesystem.

### Configuration Files

The render.yaml file in the backend directory configures the deployment. It specifies the service type as web, the runtime as Python, the build command as pip install -r requirements.txt, and the start command as uvicorn app:app --host 0.0.0.0 --port $PORT. Environment variables are defined in this file or configured through the Render dashboard.

### Deployment Steps

To deploy through the Render dashboard, connect your GitHub repository and select the backend directory as the root. Render automatically detects the render.yaml configuration and sets up the service. For manual deployment through the Render CLI, run render deploy from the backend directory after configuring the render.yaml file.

### Database Persistence

SQLite databases on Render are ephemeral and will be lost when the service restarts. For production use, consider using a managed database service or configure persistent storage through Render's disk feature. The application is designed to work without persistent message storage since all message data exists only in memory during active sessions.

### Environment Variables

Configure the following environment variables in the Render dashboard. DATABASE_URL can be set to override the default SQLite database location. ENVIRONMENT should be set to production to enable production-specific settings. ALLOWED_ORIGINS should include your frontend URLs such as https://driflly.vercel.app and https://driflly.netlify.app.

### Monitoring

Render provides built-in monitoring including logs, metrics, and alerts. Access logs through the Render dashboard to debug issues. Set up health checks using the /health endpoint to ensure the service is running correctly.

## Frontend Deployment on Vercel

### Prerequisites

A Vercel account and your code pushed to GitHub are required. The frontend is built as static files and can be deployed to Vercel's global CDN for fast loading worldwide.

### Configuration Files

The vercel.json file in the root directory configures the deployment. It specifies the build command as cd frontend && npm install && npm run build, the output directory as frontend/dist, and includes rewrites to support client-side routing.

### Deployment Steps

For deployment through the Vercel dashboard, import your GitHub repository and Vercel automatically detects the vercel.json configuration. For CLI deployment, run vercel --prod from the root directory after installing the Vercel CLI with npm i -g vercel.

### Environment Variables

Configure frontend environment variables in the Vercel dashboard under project settings. VITE_API_URL should point to your production backend URL, for example https://dispozhe.onrender.com. VITE_WS_URL should use the wss protocol for secure WebSocket connections, like wss://dispozhe.onrender.com.

### Custom Domains

Vercel allows configuring custom domains through the dashboard. Add your domain and configure DNS settings as instructed. SSL certificates are automatically provisioned and renewed by Vercel.

## Environment Configuration

### Backend Environment Variables

Create a .env file in the backend directory with the following variables. DATABASE_URL defaults to sqlite:///./chatlly.db. ENVIRONMENT should be development for local testing and production for deployed instances. ALLOWED_ORIGINS should include your frontend URLs.

### Frontend Environment Variables

Create a .env file in the frontend directory with VITE_API_URL set to your backend URL and VITE_WS_URL set to your WebSocket URL. For production, ensure these use HTTPS and WSS protocols respectively. The .env file should not be committed to version control; use .env.example as a template.

## Production Considerations

### Security Headers

The backend includes security headers middleware that sets X-Frame-Options to DENY, X-XSS-Protection to enabled, X-Content-Type-Options to nosniff, and a strict Content-Security-Policy. These headers protect against common web vulnerabilities.

### Rate Limiting

Rate limiting is configured to prevent abuse. Session creation is limited to ten requests per minute per IP. Code redemption attempts are limited to five per minute per IP to prevent brute force attacks. These limits can be adjusted in the rate limiter configuration.

### Connection Pooling

The database connection pool is configured with size fifty and overflow one hundred to handle concurrent load. Pool pre-ping verifies connections before use, and pool recycle refreshes connections after one hour to prevent staleness. These settings were determined through stress testing.

### SSL Termination

Both Render and Vercel handle SSL termination automatically. Ensure your frontend uses HTTPS URLs and WebSocket connections use WSS to maintain encryption in transit. The security headers middleware enforces secure connections in production.

## Scaling

### Vertical Scaling

The application scales vertically by increasing resources on Render. Add more memory and CPU through the Render dashboard to handle higher load. The connection pool settings may need adjustment as resources increase.

### Horizontal Scaling

For horizontal scaling, deploy multiple backend instances behind a load balancer. The WebSocket manager would need to use a distributed pub-sub system like Redis to share connection state across instances. This is planned for future releases.

### Database Scaling

SQLite is suitable for moderate load but has limitations for high concurrency. For larger deployments, consider migrating to PostgreSQL. The application uses SQLAlchemy which supports multiple database backends, making migration straightforward.

## Monitoring and Alerting

### Health Checks

The /health endpoint returns service status and can be used for monitoring. Configure Render to use this endpoint for health checks, with appropriate failure thresholds to detect and restart unhealthy instances.

### Logging

Application logs are available through Render's logging interface. Configure log levels in production to INFO to capture important events without excessive detail. Audit logs are written to a separate file for security monitoring.

### Alerts

Set up alerts in Render for service downtime, high error rates, or resource exhaustion. Configure notification channels including email, Slack, or webhooks to receive alerts when issues occur.

## Rollback Procedures

### Code Rollback

To roll back to a previous version, redeploy a previous commit through the Render or Vercel dashboard. Both platforms maintain deployment history allowing easy rollback to any previous deployment.

### Database Rollback

Database rollbacks require restoring from backup. Regular backups should be configured through Render's disk backup feature or by implementing automated database dumps. Test restoration procedures regularly to ensure backups are valid.

### Emergency Procedures

In case of critical issues, the termination endpoint can be used to manually clean up stuck sessions. The admin API provides endpoints to check and modify replay protection settings if needed. Contact support@driflly.app for assistance with major incidents.
