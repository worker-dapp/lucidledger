# CI/CD Pipeline Setup for Lucid Ledger

This guide explains how to set up and use the automated CI/CD pipeline for deploying your full-stack Lucid Ledger application to EC2.

## 🏗️ **Pipeline Overview**

The CI/CD pipeline consists of several workflows located in `.github/workflows/`:

1. **CI/CD Pipeline** (`ci.yml`) - Comprehensive testing, building, and security scanning
2. **Production Deployment** (`deploy.yml`) - Deploys full-stack to production on main branch (also supports manual staging deployment)
3. **SSL Renewal** (`ssl-renewal.yml`) - Automatically renews SSL certificates

## 🔧 **Setup Requirements**

### **1. GitHub Repository Secrets**

You need to add these secrets in your GitHub repository:

**Go to:** `Settings` → `Secrets and variables` → `Actions`

#### **Required Secrets:**
```
# EC2 Access
EC2_HOST          - Your EC2 instance public IP or domain
EC2_USER          - SSH username (ec2-user or ubuntu)
SSH_PRIVATE_KEY   - Your private SSH key for EC2 access

# Database Configuration
DB_HOST           - AWS RDS endpoint
DB_PORT           - Database port (5432)
DB_NAME           - Database name
DB_USER           - Database username
DB_PASSWORD       - Database password

# Application Configuration
VITE_DYNAMIC_ENV_ID - Dynamic Labs environment ID
```

#### **Optional Secrets (for staging deployments):**
```
# Staging EC2 Access (only needed if you have a separate staging server)
STAGING_HOST      - Staging EC2 instance IP/domain
STAGING_USER      - Staging SSH username
STAGING_SSH_KEY   - Staging SSH private key

# Note: Staging database configuration is handled via server/.env on the staging server
# The deployment script uses the same database connection as configured on the server
```

### **2. SSH Key Setup**

#### **Generate SSH Key Pair:**
```bash
# Generate new SSH key pair
ssh-keygen -t rsa -b 4096 -C "github-actions@lucidledger.co"

# Copy public key to EC2
ssh-copy-id -i ~/.ssh/id_rsa.pub ec2-user@YOUR_EC2_IP

# Copy private key content to GitHub secret
cat ~/.ssh/id_rsa
```

#### **Add to GitHub Secrets:**
1. Copy the **private key** content (including `-----BEGIN` and `-----END`)
2. Add as `SSH_PRIVATE_KEY` secret in GitHub

### **3. EC2 Instance Preparation**

Ensure your EC2 instance has:
- ✅ Docker and Docker Compose installed
- ✅ Git access to your repository
- ✅ Proper security group configuration
- ✅ Domain pointing to the instance

## 🚀 **How the Pipeline Works**

### **CI/CD Pipeline (`ci.yml`):**

1. **Frontend Testing:**
   - Install dependencies
   - Run ESLint
   - Build application
   - Upload build artifacts

2. **Backend Testing:**
   - Install dependencies
   - Test database connection
   - Build Docker images
   - Run linting (if available)

3. **Security Scanning:**
   - Trivy vulnerability scanner
   - Dependency audits (frontend & backend)
   - CodeQL analysis

4. **Docker Build Testing:**
   - Build frontend images (dev & prod)
   - Build backend images (dev & prod)
   - Test docker-compose configurations

5. **Integration Testing:**
   - PostgreSQL service for testing
   - Database migration testing
   - API endpoint testing
   - Full-stack health checks

### **Production Deployment (`deploy.yml`):**

1. **Automatic Trigger:** Push to `main` branch
   - **Manual Trigger:** Can also be triggered manually with environment selection (prod/staging)

2. **Deploy Phase:**
   - SSH to EC2 (production or staging based on selection)
   - Pull latest code from selected branch
   - Stop existing services
   - **Build Docker images on EC2** (using `docker-compose.nginx.yml`)
   - Set environment variables (VITE_API_BASE_URL, VITE_DYNAMIC_ENV_ID)
   - Start full-stack services (nginx, frontend, backend, certbot)
   - Health checks (backend & frontend)
   - API endpoint testing
   - Verify HTTPS connectivity

**Note:** Docker images are built on the EC2 server, not in GitHub Actions. This keeps the setup simple but means builds happen during deployment.

### **Staging Deployment (via `deploy.yml`):**

Staging deployments are handled by the same `deploy.yml` workflow using manual workflow dispatch:

1. **Trigger:** Manual workflow dispatch from GitHub Actions
2. **Select Environment:** Choose `staging` when triggering
3. **Select Branch:** Choose `develop` (or any branch)
4. **Deploy to Staging:**
   - Uses staging environment variables (`STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`)
   - Deploys to staging server
   - Uses `staging.lucidledger.co` domain
   - Health checks
   - Ready for testing

### **SSL Renewal Workflow:**

1. **Schedule:** Runs weekly on Monday at 2 AM UTC
2. **Check Expiration:** Verify certificate validity
3. **Renew if Needed:** Use Let's Encrypt renewal
4. **Reload Nginx:** Apply new certificates

## 📋 **Workflow Triggers**

| Workflow | Location | Trigger | Purpose |
|----------|---------|---------|---------|
| `ci.yml` | `.github/workflows/ci.yml` | Push/PR + Weekly | Comprehensive testing & security |
| `deploy.yml` | `.github/workflows/deploy.yml` | Push to `main` (auto) or Manual | Production/staging full-stack deployment |
| `ssl-renewal.yml` | `.github/workflows/ssl-renewal.yml` | Weekly + Manual | SSL certificate renewal |

## 🔄 **Deployment Process**

### **Automatic Deployment:**
1. **Push code** to `main` branch
2. **GitHub Actions** automatically trigger
3. **Tests run** to ensure code quality
4. **Deployment executes** to EC2
5. **Services restart** with new code
6. **Health checks** verify deployment

### **Manual Deployment:**
1. Go to **Actions** tab in GitHub
2. Select **Deploy** workflow
3. Click **Run workflow**
4. Choose:
   - **Environment:** `prod` (production) or `staging` (staging)
   - **Branch:** `main` (production) or `develop` (staging) or any branch
5. Click **Run workflow**

**Note:** Manual deployments allow you to deploy any branch to either environment, giving you flexibility for testing or hotfixes.

## 🧪 **Testing the Pipeline**

### **1. Test with Small Change:**
```bash
# Make a small change to any file
echo "# Test comment" >> README.md

# Commit and push
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin main
```

### **2. Monitor Progress:**
- Go to **Actions** tab in GitHub
- Watch the workflow execute
- Check logs for any errors

### **3. Verify Deployment:**
```bash
# Check if changes are live
curl https://lucidledger.co

# Check service status on EC2 (SSH into server first)
docker-compose -f docker-compose.nginx.yml ps

# View deployment logs
docker-compose -f docker-compose.nginx.yml logs -f
```

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **SSH Connection Failed:**
- Verify `SSH_PRIVATE_KEY` secret is correct
- Check EC2 security group allows SSH from GitHub Actions
- Ensure `EC2_HOST` and `EC2_USER` are correct

#### **Deployment Failed:**
- Check EC2 instance has enough disk space
- Verify Docker services are running
- Check EC2 instance logs

#### **SSL Renewal Failed:**
- Ensure port 80 is open for Let's Encrypt validation
- Check domain DNS configuration
- Verify certificate files exist

### **Debug Commands:**
```bash
# Check workflow logs
# Go to Actions → Workflow → Job → Step → View logs

# Check EC2 services
docker-compose -f docker-compose.nginx.yml logs

# Test connectivity
curl -I https://lucidledger.co
```

## 🔒 **Security Best Practices**

1. **Rotate SSH keys** regularly
2. **Use least privilege** for EC2 user
3. **Monitor workflow executions** for unauthorized access
4. **Keep secrets secure** and never commit them to code
5. **Review security scan results** regularly

## 📊 **Monitoring and Alerts**

### **Workflow Notifications:**
- GitHub will send email notifications for workflow failures
- You can configure additional notification methods

### **Health Checks:**
- The pipeline includes automatic health checks
- Failed deployments will be reported in GitHub Actions

## 🎯 **Next Steps**

1. **Set up GitHub secrets** as described above
2. **Test the pipeline** with a small change
3. **Monitor deployments** and adjust as needed
4. **Set up staging environment** (optional) - Configure `STAGING_HOST`, `STAGING_USER`, and `STAGING_SSH_KEY` secrets
5. **Configure notifications** for your team

## 📁 **Workflow Files Location**

All CI/CD workflow files are located in:
```
.github/workflows/
├── ci.yml              # Testing and security scanning
├── deploy.yml          # Production and staging deployments
└── ssl-renewal.yml     # SSL certificate renewal
```

## 📚 **Additional Resources**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [EC2 Security Best Practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-best-practices.html)

---

**Your CI/CD pipeline is now ready!** 🚀

Every push to main will automatically deploy to production, with security scanning and SSL renewal happening automatically. The pipeline ensures your application stays up-to-date and secure.
