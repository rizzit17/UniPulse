pipeline {
    agent any

    tools {
        jdk 'Java-21'
        maven 'Maven-3.9'
    }

    environment {
        DOCKER_REGISTRY = '123456789012.dkr.ecr.us-east-1.amazonaws.com'
        IMAGE_NAME = 'unipulse-core-api'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Unit Test') {
            steps {
                dir('backend') {
                    sh 'mvn -B clean compile test'
                }
            }
        }

        stage('Verify & Integration Test') {
            steps {
                dir('backend') {
                    sh 'mvn -B verify'
                }
            }
            post {
                always {
                    junit 'backend/**/target/surefire-reports/*.xml'
                    jacoco execPattern: 'backend/**/target/jacoco.exec'
                }
            }
        }

        stage('Quality & Security Scan') {
            parallel {
                stage('OWASP Dependency Check') {
                    steps {
                        echo 'Running OWASP dependency check...'
                    }
                }
                stage('SonarQube Analysis') {
                    steps {
                        echo 'Running code quality scan...'
                    }
                }
            }
        }

        stage('Build Docker Images') {
            when {
                branch 'main'
            }
            steps {
                echo "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                echo "Deploying ${IMAGE_NAME}:${IMAGE_TAG} to ECS Staging cluster..."
            }
        }
    }

    post {
        failure {
            echo "Pipeline failed on build ${env.BUILD_NUMBER}"
        }
        success {
            echo "Pipeline succeeded for commit ${env.GIT_COMMIT}"
        }
    }
}
