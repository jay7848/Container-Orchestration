# LRC MERN Stack Deployment Guide

This project demonstrates deployment of a **MERN stack application** (MongoDB, Express/Node.js, React, Nginx) on Kubernetes with **Helm** and **Jenkins CI/CD**.

---

## 📌 Project Structure

- **Frontend (React + Nginx)** → learnerReportCS_frontend  
- **Backend (Node.js/Express)** → learnerReportCS_backend  
- **Database** → MongoDB StatefulSet  
- **Kubernetes Manifests** → Deployments, Services, Ingress  
- **Helm Chart** → Streamlined Kubernetes deployment  
- **Jenkinsfile** → Automates CI/CD pipeline  

---

## 🚀 Steps Completed

### 1. Dockerization
- Created Dockerfiles for frontend and backend.
- Built and pushed images to DockerHub (`jay15229` repo).

Example commands:
```bash
# Frontend
docker build -t jay15229/lrc-frontend:1.0 ./frontend
docker push jay15229/lrc-frontend:1.0

# Backend
docker build -t jay15229/lrc-backend:1.0 ./backend
docker push jay15229/lrc-backend:1.0
```

---

### 2. Kubernetes Manifests

- **MongoDB StatefulSet (`mongo-statefulset.yaml`)**
- **Backend Deployment (`backend-deployment.yaml`)**
- **Frontend Deployment (`frontend-deployment.yaml`)**
- **Services (`services.yaml`)**
- **Ingress (`ingress.yaml`)**
- **ConfigMap & Secret (`configmap.yaml`, `secret.yaml`)**

Applied with:
```bash
kubectl apply -f k8s/
kubectl get pods -n lrc
kubectl get svc -n lrc
```

Ingress Exposed:
- Frontend → `http://lr.local`
- Backend APIs → `http://lr.local/api/...`

✅ Verified frontend and backend both working.

---

### 3. Helm Chart

Path: `helm/lrc/`

```
helm/
 └── lrc/
     ├── Chart.yaml
     ├── values.yaml
     └── templates/
         ├── mongo-statefulset.yaml
         ├── backend-deployment.yaml
         ├── frontend-deployment.yaml
         ├── services.yaml
         └── ingress.yaml
```

#### Chart.yaml
```yaml
apiVersion: v2
name: lrc
description: A Helm chart for LRC MERN application
version: 0.1.0
appVersion: "1.0"
```

#### values.yaml (sample)
```yaml
frontend:
  image: jay15229/lrc-frontend:1.0
  replicaCount: 1
  servicePort: 80

backend:
  image: jay15229/lrc-backend:1.0
  replicaCount: 1
  servicePort: 3001

mongo:
  image: mongo:5.0
  replicaCount: 1
  storage: 1Gi
```

#### Helm Commands
```bash
# Install/Upgrade release
helm upgrade --install lrc ./helm/lrc -n lrc

# Check resources
kubectl get all -n lrc
```

---

### 4. Jenkins CI/CD

Created `Jenkinsfile` at repo root.

```groovy
pipeline {
  agent any

  environment {
    DOCKERHUB_USER = credentials('dockerhub-username')
    DOCKERHUB_PASS = credentials('dockerhub-password')
    DOCKER_IMAGE_FE = "jay15229/lrc-frontend"
    DOCKER_IMAGE_BE = "jay15229/lrc-backend"
    K8S_NAMESPACE = "lrc"
  }

  stages {
    stage('Checkout') {
      steps { git 'https://github.com/UnpredictablePrashant/learnerReportCS_frontend' }
    }

    stage('Build Docker Images') {
      steps {
        sh '''
        docker login -u $DOCKERHUB_USER -p $DOCKERHUB_PASS
        docker build -t $DOCKER_IMAGE_FE:$BUILD_NUMBER ./frontend
        docker build -t $DOCKER_IMAGE_BE:$BUILD_NUMBER ./backend
        docker push $DOCKER_IMAGE_FE:$BUILD_NUMBER
        docker push $DOCKER_IMAGE_BE:$BUILD_NUMBER
        '''
      }
    }

    stage('Deploy with Helm') {
      steps {
        sh '''
        helm upgrade --install lrc ./helm/lrc -n $K8S_NAMESPACE           --set frontend.image=$DOCKER_IMAGE_FE:$BUILD_NUMBER           --set backend.image=$DOCKER_IMAGE_BE:$BUILD_NUMBER
        '''
      }
    }
  }
}
```

---

### 5. Verification

- Frontend UI → `http://lr.local`
- Backend health check → `http://lr.local/api/health`
- Logs:
```bash
kubectl logs deploy/lrc-backend -n lrc
kubectl logs deploy/lrc-frontend -n lrc
```

---

## 📝 Challenges & Fixes

- Service port mismatch (fixed by aligning backend containerPort and Service targetPort).  
- Ingress path rewrite (`/api` prefix handled).  
- Probes added for backend (`/api/health`).  
- Ensured MongoDB accessible inside cluster via DNS (`mongo.lrc.svc.cluster.local`).  

---

## ✅ Final Status

- Frontend + Backend running in Kubernetes (via Helm).  
- Ingress working at `http://lr.local`.  
- Jenkins automates build & deploy.  

---

## 📂 File Placement

- Place this **README.md** at the **root of your project repo** (same level as `frontend/`, `backend/`, `helm/`, `k8s/`).

