# MediConnect Cloud: Cloud Services Mapping

MediConnect Cloud demonstrates the complete integration of all five cloud service models within an AWS architecture:

1. **Infrastructure as a Service (IaaS):**
   - **Service:** Amazon EC2
   - **Implementation:** Virtual compute instances provisioned via AWS Elastic Beanstalk running the Node.js Express backend runtime.

2. **Platform as a Service (PaaS):**
   - **Service:** AWS Elastic Beanstalk
   - **Implementation:** Manages application deployment lifecycles, health monitoring, auto-scaling groups, and environment security configurations.

3. **Database as a Service (DBaaS):**
   - **Service:** Amazon RDS for MySQL
   - **Implementation:** Fully managed relational database instance deployed in private subnets with automated daily backups and VPC security group isolation.

4. **Storage as a Service:**
   - **Service:** Amazon S3
   - **Implementation:** Private document bucket configured with Block Public Access, encryption at rest (SSE-S3), CORS rules, and short-lived IAM presigned upload/download URLs.

5. **Security as a Service:**
   - **Service:** AWS Cognito, IAM, & WAF
   - **Implementation:** Amazon Cognito User Pools for identity management and JWT token issuance; AWS WAF for web request filtering; IAM for least-privilege service permissions.