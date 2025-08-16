# Learner Report Card - PRD

## Project setup

Installing the node_modules:
```bash
npm install --force
```

Create `.env` file with following content but change the link to backend:
```bash
REACT_APP_API_BASE_URL=http://localhost:3001
```

## Build Steps

Building the docker image. React application is running at port 3000 inside the container and is exposed at port 80 in host machine.

```
docker build -f Dockerfile -t frontend-lrccapstone .
docker run -it -p 80:3000 frontend-lrccapstone
```

View the project at http://127.0.0.1

# Reference

https://github.com/minimal-ui-kit/material-kit-react
https://minimal-kit-react.vercel.app/dashboard/app
https://github.com/UnpredictablePrashant/learnerReportCS_frontend
https://lrccapstone.atlassian.net/jira/your-work
https://github.com/UnpredictablePrashant/learnerReportCS_frontend/pull/1
