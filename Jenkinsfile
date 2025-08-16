pipeline {
  agent any
  options { timestamps() }

  parameters {
    string(name: 'IMAGE_TAG', defaultValue: "1.1-${env.BUILD_NUMBER}", description: 'Tag to apply to FE/BE images')
  }

  environment {
    // DockerHub
    DOCKERHUB_CREDS = credentials('dockerhub-creds') // provides DOCKERHUB_CREDS_USR / DOCKERHUB_CREDS_PSW
    DOCKERHUB_USER  = 'jay15229'

    // Image names
    FE_IMAGE = "${DOCKERHUB_USER}/lrc-frontend:${IMAGE_TAG}"
    BE_IMAGE = "${DOCKERHUB_USER}/lrc-backend:${IMAGE_TAG}"

    // K8s/Helm settings
    KUBE_NS   = 'lrc'
    RELEASE   = 'lrc'
    HOST      = 'lr.local'  // map this to your ingress IP (e.g. 192.168.49.2) in hosts file
    MONGO_URI = 'mongodb://mongo.lrc.svc.cluster.local:27017/learnerdb'
  }

  stages {

    stage('Preflight') {
      steps {
        sh '''
          set -e
          echo "Docker version:" && docker --version || true
          echo "Kubectl version:" && kubectl version --client=true || true
          echo "Helm version:" && helm version --short || true
        '''
      }
    }

    stage('Checkout') {
      steps {
        echo 'Checking out frontend and backend repos...'
        dir('frontend') {
          git url: 'https://github.com/UnpredictablePrashant/learnerReportCS_frontend.git', branch: 'main'
        }
        dir('backend') {
          git url: 'https://github.com/UnpredictablePrashant/learnerReportCS_backend.git', branch: 'main'
        }
      }
    }

    stage('Write Dockerfiles (known-good)') {
      steps {
        dir('frontend') {
          writeFile file: 'Dockerfile', text: '''
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY . .
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
'''.stripIndent()
        }
        dir('backend') {
          writeFile file: 'Dockerfile', text: '''
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps
COPY . .
ENV PORT=3000 HOST=0.0.0.0 BASE_PATH=/api
EXPOSE 3000
CMD ["node","index.js"]
'''.stripIndent()
        }
      }
    }

    stage('Build FE Image') {
      steps {
        dir('frontend') {
          sh """
            docker build \
              -t ${FE_IMAGE} \
              -t ${DOCKERHUB_USER}/lrc-frontend:latest \
              --build-arg REACT_APP_API_BASE_URL=http://${HOST}/api \
              .
          """
        }
      }
    }

    stage('Build BE Image') {
      steps {
        dir('backend') {
          sh """
            docker build \
              -t ${BE_IMAGE} \
              -t ${DOCKERHUB_USER}/lrc-backend:latest \
              .
          """
        }
      }
    }

    stage('Login & Push') {
      steps {
        sh """
          echo "${DOCKERHUB_CREDS_PSW}" | docker login -u "${DOCKERHUB_CREDS_USR}" --password-stdin
          docker push ${FE_IMAGE}
          docker push ${DOCKERHUB_USER}/lrc-frontend:latest
          docker push ${BE_IMAGE}
          docker push ${DOCKERHUB_USER}/lrc-backend:latest
        """
      }
    }

    stage('Create k8s Manifests') {
      steps {
        sh 'mkdir -p k8s'
        // Frontend
        writeFile file: 'k8s/lrc-frontend.yaml', text: """
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lrc-frontend
  namespace: ${KUBE_NS}
spec:
  replicas: 1
  selector: { matchLabels: { app: lrc-frontend } }
  template:
    metadata:
      labels: { app: lrc-frontend }
    spec:
      containers:
      - name: lrc-frontend
        image: ${FE_IMAGE}
        ports: [{ containerPort: 80 }]
---
apiVersion: v1
kind: Service
metadata:
  name: lrc-frontend-svc
  namespace: ${KUBE_NS}
spec:
  selector: { app: lrc-frontend }
  ports:
  - port: 80
    targetPort: 80
""".stripIndent()

        // Backend
        writeFile file: 'k8s/lrc-backend.yaml', text: """
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lrc-backend
  namespace: ${KUBE_NS}
spec:
  replicas: 1
  selector: { matchLabels: { app: lrc-backend } }
  template:
    metadata:
      labels: { app: lrc-backend }
    spec:
      containers:
      - name: lrc-backend
        image: ${BE_IMAGE}
        env:
        - { name: PORT,      value: "3000" }
        - { name: HOST,      value: "0.0.0.0" }
        - { name: BASE_PATH, value: "/api" }
        - { name: MONGO_URI, value: "${MONGO_URI}" }
        ports: [{ containerPort: 3000 }]
---
apiVersion: v1
kind: Service
metadata:
  name: lrc-backend-svc
  namespace: ${KUBE_NS}
spec:
  selector: { app: lrc-backend }
  ports:
  - port: 3001
    targetPort: 3000
""".stripIndent()

        // Mongo (simple Deployment + headless Service)
        writeFile file: 'k8s/mongo.yaml', text: """
apiVersion: v1
kind: Service
metadata:
  name: mongo
  namespace: ${KUBE_NS}
spec:
  clusterIP: None
  selector: { app: mongo }
  ports:
  - port: 27017
    targetPort: 27017
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongo
  namespace: ${KUBE_NS}
spec:
  replicas: 1
  selector: { matchLabels: { app: mongo } }
  template:
    metadata:
      labels: { app: mongo }
    spec:
      containers:
      - name: mongo
        image: mongo:6
        ports: [{ containerPort: 27017 }]
""".stripIndent()

        // Ingress (nginx)
        writeFile file: 'k8s/ingress.yaml', text: """
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lrc-ingress
  namespace: ${KUBE_NS}
spec:
  ingressClassName: nginx
  rules:
  - host: ${HOST}
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: lrc-frontend-svc
            port: { number: 80 }
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: lrc-backend-svc
            port: { number: 3001 }
""".stripIndent()
      }
    }

    stage('Deploy (apply k8s/)') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG')]) {
          sh """
            set -e
            echo "Using kubeconfig at: $KUBECONFIG"
            kubectl get nodes
            kubectl create namespace ${KUBE_NS} --dry-run=client -o yaml | kubectl apply -f -
            kubectl -n ${KUBE_NS} apply -f k8s/
            kubectl -n ${KUBE_NS} rollout status deploy/lrc-frontend
            kubectl -n ${KUBE_NS} rollout status deploy/lrc-backend
          """
        }
      }
    }

    stage('Smoke (cluster-side)') {
      steps {
        withCredentials([file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG')]) {
          sh "kubectl -n ${KUBE_NS} get pods,svc,ingress -o wide || true"
        }
      }
    }
  }

  post {
    always {
      withCredentials([file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG')]) {
        sh 'kubectl -n ${KUBE_NS} get pods,svc,ingress -o wide || true'
      }
      echo "Pipeline finished. FE image: ${FE_IMAGE}  BE image: ${BE_IMAGE}"
    }
  }
}
