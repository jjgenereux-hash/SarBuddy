# SARBuddy - Cloud Run Deployment Guide

## Overview

This repository has been configured for deploying SARBuddy as a static React/Vite application using NGINX on Google Cloud Run.

## Changes Summary

The following changes have been made to prepare the repository for Cloud Run deployment:

### 1. **Dockerfile** (NGINX-based for static React/Vite deployment)
- Replaced the Python/Flask-based Dockerfile with a multi-stage NGINX-based Dockerfile
- **Build Stage**: Uses Node.js 18 Alpine to build the React/Vite application from the `frontend/` directory
- **Production Stage**: Uses NGINX Alpine to serve the static build files
- Configured to expose port 8080 (Cloud Run default)

### 2. **nginx.conf** (NGINX configuration for Cloud Run)
- Listens on port 8080 (Cloud Run requirement)
- Serves static files from `/usr/share/nginx/html`
- Implements SPA routing with `try_files` directive for React Router
- Includes gzip compression for optimal performance
- Adds security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Configures cache headers for static assets (1 year expiry)
- Includes `/health` endpoint for Cloud Run health checks

### 3. **.dockerignore** (Build optimization)
- Excludes `node_modules`, build artifacts, and development files
- Optimizes Docker build context and reduces image size
- Excludes legacy Python files and CI/CD configurations

### 4. **cloudbuild.yaml** (existing, verified compatible)
- Already configured for Cloud Build and Cloud Run deployment
- Build steps: Docker build → Push to GCR → Deploy to Cloud Run

## Build and Deploy Workflow

### Local Testing

1. **Build the Docker image:**
   ```bash
   docker build -t sarbuddy:latest .
   ```

2. **Run locally:**
   ```bash
   docker run -p 8080:8080 sarbuddy:latest
   ```

3. **Access the application:**
   ```
   http://localhost:8080
   ```

### Manual Cloud Run Deployment

1. **Set your GCP project:**
   ```bash
   export PROJECT_ID="your-gcp-project-id"
   export REGION="us-central1"
   gcloud config set project $PROJECT_ID
   ```

2. **Build and push to Google Container Registry:**
   ```bash
   gcloud builds submit --tag gcr.io/$PROJECT_ID/sarbuddy
   ```

3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy sarbuddy \
     --image gcr.io/$PROJECT_ID/sarbuddy \
     --platform managed \
     --region $REGION \
     --allow-unauthenticated \
     --port 8080 \
     --memory 256Mi \
     --cpu 1
   ```

### Automated Deployment via Cloud Build

The existing `cloudbuild.yaml` will automatically:

1. **Trigger on push to main branch** (if Cloud Build trigger is configured)
2. **Build the Docker image** using the new NGINX-based Dockerfile
3. **Push to Google Container Registry** at `gcr.io/${PROJECT_ID}/sarbuddy:latest`
4. **Deploy to Cloud Run** service named `tiered-web-app-api`

**To set up the Cloud Build trigger:**

```bash
gcloud builds triggers create github \
  --repo-name=SarBuddy \
  --repo-owner=jjgenereux-hash \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

## Architecture

### Multi-Stage Docker Build

```
┌─────────────────────────────────┐
│   Stage 1: Build (node:18-alpine) │
│   - Install dependencies        │
│   - Build Vite app (npm run build) │
│   - Output: /app/dist           │
└─────────────────────────────────┘
              ↓
┌─────────────────────────────────┐
│   Stage 2: Production (nginx:alpine) │
│   - Copy dist files             │
│   - Configure NGINX             │
│   - Expose port 8080            │
└─────────────────────────────────┘
```

### Request Flow

```
Cloud Run → NGINX (port 8080) → Static Files (/usr/share/nginx/html)
                ↓
         React Router (SPA)
```

## Configuration Details

### Port Configuration
- **NGINX listens on:** 8080 (configured in `nginx.conf`)
- **Docker exposes:** 8080 (configured in `Dockerfile`)
- **Cloud Run expects:** 8080 (default)

### Build Output Directory
- **Vite builds to:** `dist/` (standard Vite output)
- **NGINX serves from:** `/usr/share/nginx/html`

### Environment Variables

If your application requires environment variables at build time:

1. **Add to Dockerfile:**
   ```dockerfile
   ARG VITE_API_URL
   ENV VITE_API_URL=$VITE_API_URL
   ```

2. **Pass during build:**
   ```bash
   gcloud builds submit --tag gcr.io/$PROJECT_ID/sarbuddy \
     --substitutions=_VITE_API_URL="https://api.example.com"
   ```

## Performance Optimizations

- **Multi-stage build:** Reduces final image size
- **Alpine Linux:** Minimal base images
- **Gzip compression:** Enabled for text-based assets
- **Cache headers:** 1-year expiry for static assets
- **Optimized node_modules:** Using `npm ci` for reproducible builds

## Health Checks

The NGINX configuration includes a `/health` endpoint:

```bash
curl http://localhost:8080/health
# Returns: healthy
```

## Troubleshooting

### Build Failures

1. **Check package.json location:**
   ```bash
   # Should be at frontend/package.json
   ls -la frontend/package.json
   ```

2. **Verify build command:**
   ```bash
   cd frontend && npm run build
   ```

3. **Check Docker build logs:**
   ```bash
   docker build -t sarbuddy:test . --no-cache
   ```

### Runtime Issues

1. **Check NGINX logs:**
   ```bash
   # In Cloud Run logs
   gcloud logging read "resource.type=cloud_run_revision" --limit 50
   ```

2. **Verify port binding:**
   ```bash
   # NGINX should listen on 8080
   docker run -it sarbuddy:latest cat /etc/nginx/conf.d/default.conf
   ```

### SPA Routing Issues

- Ensure `try_files $uri $uri/ /index.html;` is in nginx.conf
- This allows React Router to handle client-side routing

## Resource Recommendations

### For Production:
- **Memory:** 256Mi (adequate for static NGINX serving)
- **CPU:** 1 (sufficient for small to medium traffic)
- **Min Instances:** 0 (scale to zero when not in use)
- **Max Instances:** 10 (adjust based on expected traffic)

### For High Traffic:
```bash
gcloud run deploy sarbuddy \
  --memory 512Mi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 100
```

## Cost Optimization

- **Scale to zero:** No cost when not serving requests
- **Minimal image size:** Alpine-based images reduce storage costs
- **Efficient caching:** Reduces bandwidth and compute

## Next Steps

1. ✅ **Dockerfile replaced** with NGINX-based configuration
2. ✅ **nginx.conf created** with Cloud Run optimizations
3. ✅ **.dockerignore created** for build efficiency
4. ⚠️ **Test deployment** to verify the build works
5. ⚠️ **Configure custom domain** (optional)
6. ⚠️ **Set up monitoring** and alerts

## Support

For issues or questions:
- Review Cloud Build logs: `gcloud builds log <BUILD_ID>`
- Review Cloud Run logs: `gcloud logging read`
- Check GitHub Actions/Cloud Build for CI/CD status

---

**Last Updated:** October 25, 2025  
**Maintainer:** jjgenereux-hash  
**Repository:** SARBuddy
