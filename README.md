# MediConnect Cloud: Healthcare Appointment and Records Portal

MediConnect Cloud is an enterprise-grade cloud-ready web application demonstrating the integration of all five cloud service models (IaaS, PaaS, DBaaS, Storage as a Service, and Security as a Service).

## Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS, React Router, Axios
- **Backend:** Node.js, Express.js, mysql2, Zod, Helmet, AWS SDK v3
- **Database:** MySQL / Amazon RDS
- **Cloud Infrastructure:** Amazon EC2, AWS Elastic Beanstalk, Amazon S3, Amazon Cognito

## Local Development Setup
1. Clone the repository and navigate to the root directory.
2. Start the local database using Docker Compose:
   ```bash
   docker-compose up -d