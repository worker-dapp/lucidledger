# CI/CD Pipeline Setup for Lucid Ledger

This guide explains how to set up and use the automated CI/CD pipeline for deploying your full-stack Lucid Ledger application to EC2.

## 🏗️ **Pipeline Overview**

The CI/CD pipeline consists of several workflows:

1. **CI/CD Pipeline** (`ci.yml`) - Comprehensive testing, building, and security scanning
2. **Production Deployment** (`deploy.yml`) - Deploys full-stack to production on main branch
3. **Staging Deployment** (`staging.yml`) - Deploys to staging environment on develop branch
4. **SSL Renewal** (`ssl-renewal.yml`) - Automatically renews SSL certificates

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

#### **Optional Secrets (for staging):**
```
# Staging EC2 Access
STAGING_HOST      - Staging EC2 instance IP/domain
STAGING_USER      - Staging SSH username
STAGING_SSH_KEY   - Staging SSH private key

# Staging Database (if different from production)
STAGING_DB_HOST   - Staging database endpoint
STAGING_DB_PORT   - Staging database port
STAGING_DB_NAME   - Staging database name
STAGING_DB_USER   - Staging database username
STAGING_DB_PASSWORD - Staging database password
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

1. **Pre-Deploy Tests:**
   - Frontend build test
   - Backend build test
   - Docker build validation

2. **Deploy Phase:**
   - SSH to EC2
   - Pull latest code
   - Create environment files
   - Stop existing services
   - Rebuild and start full-stack services
   - Health checks (backend & frontend)
   - API endpoint testing

### **Staging Deployment (`staging.yml`):**

1. **Trigger:** Push to `develop` branch
2. **Quick Build Test:** Validate builds
3. **Deploy to Staging:**
   - Use staging environment variables
   - Deploy to staging server
   - Health checks
   - Ready for testing

### **SSL Renewal Workflow:**

1. **Schedule:** Runs weekly on Monday at 2 AM UTC
2. **Check Expiration:** Verify certificate validity
3. **Renew if Needed:** Use Let's Encrypt renewal
4. **Reload Nginx:** Apply new certificates

## 📋 **Workflow Triggers**

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR + Weekly | Comprehensive testing & security |
| `deploy.yml` | Push to `main` | Production full-stack deployment |
| `staging.yml` | Push to `develop` | Staging deployment |
| `ssl-renewal.yml` | Weekly + Manual | SSL certificate renewal |

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
2. Select **Deploy to EC2** workflow
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

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

# Check service status on EC2
docker-compose -f docker-compose.nginx.yml ps
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
4. **Set up staging environment** if desired
5. **Configure notifications** for your team

## 📚 **Additional Resources**

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [EC2 Security Best Practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-best-practices.html)

---

**Your CI/CD pipeline is now ready!** 🚀

Every push to main will automatically deploy to production, with security scanning and SSL renewal happening automatically. The pipeline ensures your application stays up-to-date and secure.
