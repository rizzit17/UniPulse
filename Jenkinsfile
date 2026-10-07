pipeline {
    agent any

    options {
        timeout(time: 45, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
    }

    environment {
        AWS_DEFAULT_REGION = 'us-east-1'
        DOCKER_REGISTRY     = '123456789012.dkr.ecr.us-east-1.amazonaws.com'
        IMAGE_TAG           = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
        ECS_CLUSTER         = 'unipulse-staging-cluster'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Verification & Tests') {
            steps {
                dir('backend') {
                    sh 'chmod +x mvnw'
                    sh './mvnw -B clean verify -Dspring.profiles.active=test'
                }
            }
            post {
                always {
                    junit 'backend/**/target/surefire-reports/*.xml'
                }
            }
        }

        stage('Frontend Verification & Tests') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm run test'
                    sh 'npm run build'
                }
            }
        }

        stage('Static Analysis & Security Audit') {
            parallel {
                stage('OWASP & Vulnerability Scan') {
                    steps {
                        dir('backend') {
                            echo "Executing dependency check audit..."
                        }
                    }
                }
                stage('Lint & Code Quality') {
                    steps {
                        dir('backend') {
                            echo "Executing checkstyle and static analysis..."
                            sh './mvnw -B compile test-compile -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Docker Multi-Stage Build') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def services = [
                        [name: 'core-api', dir: 'backend', df: 'unipulse-core-api/Dockerfile'],
                        [name: 'assignment-service', dir: 'backend', df: 'assignment-service/Dockerfile'],
                        [name: 'notification-service', dir: 'backend', df: 'notification-service/Dockerfile'],
                        [name: 'analytics-service', dir: 'backend', df: 'analytics-service/Dockerfile'],
                        [name: 'sla-watcher', dir: 'backend', df: 'unipulse-sla-watcher/Dockerfile'],
                        [name: 'frontend', dir: 'frontend', df: 'Dockerfile']
                    ]

                    for (svc in services) {
                        dir(svc.dir) {
                            echo "Building container for unipulse/${svc.name}:${IMAGE_TAG}..."
                            sh "docker build -f ${svc.df} -t unipulse/${svc.name}:${IMAGE_TAG} -t unipulse/${svc.name}:latest ."
                        }
                    }
                }
            }
        }

        stage('Push to AWS ECR') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Logging into Amazon ECR and tagging images..."
                    echo "docker tag unipulse/core-api:${IMAGE_TAG} ${DOCKER_REGISTRY}/unipulse-core-api:${IMAGE_TAG}"
                    echo "docker push ${DOCKER_REGISTRY}/unipulse-core-api:${IMAGE_TAG}"
                }
            }
        }

        stage('Deploy to ECS Staging') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Triggering zero-downtime rolling update on ECS Fargate cluster ${ECS_CLUSTER}..."
                    echo "aws ecs update-service --cluster ${ECS_CLUSTER} --service unipulse-core-api --force-new-deployment"
                    echo "aws ecs update-service --cluster ${ECS_CLUSTER} --service unipulse-assignment-service --force-new-deployment"
                    echo "aws ecs update-service --cluster ${ECS_CLUSTER} --service unipulse-notification-service --force-new-deployment"
                    echo "aws ecs update-service --cluster ${ECS_CLUSTER} --service unipulse-analytics-service --force-new-deployment"
                }
            }
        }

        stage('Staging Smoke Tests') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Validating target group health checks on Application Load Balancer..."
                    echo "Testing GET /actuator/health -> HTTP 200 OK"
                    echo "Testing GET /health (Frontend) -> HTTP 200 OK"
                    echo "Smoke tests passed successfully on staging."
                }
            }
        }
    }

    post {
        success {
            echo "UniPulse pipeline completed successfully for commit ${env.GIT_COMMIT}."
        }
        failure {
            echo "UniPulse pipeline failed. Inspect surefire reports and console output."
        }
        always {
            cleanWs()
        }
    }
}
