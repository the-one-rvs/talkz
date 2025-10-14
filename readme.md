# TalkZ — Microservices Based Secure Talking App

This repository contains the TalkZ microservices stack (local and infra notes, run instructions, and an ops blueprint). This README explains how to run the services locally, how OAuth cookie handling is implemented (direct & gateway approaches), and the planned production architecture (EKS + Helm + GitOps + security + observability + IaC). It also documents each microservice and points to the main files to inspect.

IMPORTANT: for local debugging read the service-specific env files (each service uses dotenv). See service `index.js` files:
- [apiGateway/src/index.js](apiGateway/src/index.js)
- [oAuth/src/index.js](oAuth/src/index.js)
- [generateToken/src/index.js](generateToken/src/index.js)
- [login/src/index.js](login/src/index.js)
- [register/src/index.js](register/src/index.js)
- [keyHandler/src/index.js](keyHandler/src/index.js)
- [getUser/src/index.js](getUser/src/index.js)
- [chatHandler/src/index.js](chatHandler/src/index.js)
- [logout/src/index.js](logout/src/index.js)
- [updateAccount/src/index.js](updateAccount/src/index.js)
- Frontend: [frontend/src/main.jsx](frontend/src/main.jsx)

---

Table of contents
- Overview
- Local development (quick start)
- Service-by-service: purpose & key files
- OAuth flow & cookie handling (direct from gateway)
  - Direct token setting (server-to-server) recommended
  - Popup / postMessage fallback
- Troubleshooting / common pitfalls
- Production architecture (EKS + Helm + ArgoCD + security + observability)
- IaC & CI/CD (Terraform + Ansible + GitOps)
- Appendix: env vars & useful links

---

Overview

TalkZ is implemented as small HTTP/GraphQL microservices behind an API Gateway. The gateway proxies frontend requests to services, provides a single origin for cookies, and centralizes authentication checks. OAuth flow uses Google via the `oAuth` service and the gateway sets httpOnly cookies on behalf of the frontend to avoid cross-site cookie restrictions.

---

Local development (quick start)

1. Install dependencies globally
```sh
# one-time
node --version      # recommend v18+ or node 20
npm --version
```

2. Start services (example pattern — each service folder has package.json)
```sh
# in repo root, run for each service in a terminal:
cd apiGateway && npm install && npm run start
cd login && npm install && npm run start
cd generateToken && npm install && npm run start
cd oAuth && npm install && npm run start
cd register && npm install && npm run start
cd getUser && npm install && npm run start
cd keyHandler && npm install && npm run start
cd chatHandler && npm install && npm run start
cd logout && npm install && npm run start
cd updateAccount && npm install && npm run start

# frontend
cd frontend && npm install && npm run dev
```

Notes:
- Each service uses dotenv with `path: './env'` (some use `.env`). Check service root for exact env file naming.
- The gateway should be first or accessible on the origin your frontend expects. API routes are mounted under `/api/v1` — see [apiGateway/src/proxy.js](apiGateway/src/proxy.js) and [apiGateway/src/app.js](apiGateway/src/app.js).

---

Service-by-service (short)

- API Gateway
  - Purpose: central entrypoint, cookie management, proxying, auth checks.
  - Key files:
    - [apiGateway/src/app.js](apiGateway/src/app.js)
    - [apiGateway/src/index.js](apiGateway/src/index.js)
    - [apiGateway/src/proxy.js](apiGateway/src/proxy.js) (proxy mappings and interceptors)
    - Metrics: [apiGateway/src/metrics.js](apiGateway/src/metrics.js)

- oAuth Service
  - Purpose: passport Google login, create/find user, return tokens to caller.
  - Key files:
    - [oAuth/src/app.js](oAuth/src/app.js)
    - [oAuth/src/routes/oauth.route.js](oAuth/src/routes/oauth.route.js)
    - [`tokens`](oAuth/src/controller/oauth.controller.js) — token creation and response. See: [`tokens`](oAuth/src/controller/oauth.controller.js)
    - Passport setup: [oAuth/src/middleware/passport.middleware.js](oAuth/src/middleware/passport.middleware.js)

- generateToken Service
  - Purpose: sign access & refresh tokens, refresh flow.
  - Key files:
    - [generateToken/src/app.js](generateToken/src/app.js)
    - [generateToken/src/routes/token.route.js](generateToken/src/routes/token.route.js)
    - [generateToken/src/controller/token.controller.js](generateToken/src/controller/token.controller.js)

- login Service
  - Purpose: email/password login, triggers token generation via token service.
  - Key files:
    - [login/src/app.js](login/src/app.js)
    - [login/.env](login/.env)
    - [login/src/controller/login.controller.js](login/src/controller/login.controller.js)

- register Service
  - Purpose: registration & email verification.
  - Key files:
    - [register/src/controller/register.controller.js](register/src/controller/register.controller.js)

- getUser Service
  - Purpose: GraphQL for reading current user and user lists.
  - Key files:
    - [getUser/src/app.js](getUser/src/app.js)
    - [getUser/src/graphql/index.js](getUser/src/graphql/index.js)

- keyHandler Service
  - Purpose: store/fetch public/private keys, used by chat encryption.
  - Key files:
    - [keyHandler/src/routes/key.route.js](keyHandler/src/routes/key.route.js)
    - [keyHandler/src/controller/key.controller.js](keyHandler/src/controller/key.controller.js)
    - Middleware that fetches user: [keyHandler/src/middleware/fetchUser.middleware.js](keyHandler/src/middleware/fetchUser.middleware.js)

- chatHandler, logout, updateAccount
  - Purpose: as named. See their `src` folders and `index.js`.

- Frontend
  - Key pages:
    - Login flow: [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx) (popup + postMessage logic)
    - OAuth popup receiver/checks are implemented client-side to receive postMessage and call the gateway to set cookies.

---

OAuth cookie handling — direct server-to-server (recommended for reliable httpOnly cookies)

Problem: browsers block cross-site httpOnly cookie setting in many local scenarios. To set httpOnly cookies reliably for the frontend origin, the API Gateway must set cookies on responses from the gateway origin (the same origin the frontend uses).

Flow (direct approach you requested)
1. The frontend opens popup to the API Gateway route that initiates Google OAuth:
   - Popup URL: `/api/v1/oAuthService/google` (the gateway proxies to oAuth).
   - See popup opener in [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx).

2. Google redirects back to the configured callback. Configure Google callback URL to point at the API Gateway callback so the gateway receives code and handles server-to-server exchange:
   - Example callback: `https://<gateway-host>/api/v1/oAuthService/google/callback`
   - Gateway proxy mapping: [apiGateway/src/proxy.js](apiGateway/src/proxy.js) — ensure the gateway proxies the callback to the oAuth service OR implement a direct gateway callback handler that:
     - Forwards the callback request to the `oAuth` service (server-to-server).
     - Receives tokens in JSON from [`tokens`](oAuth/src/controller/oauth.controller.js).
     - On success: sets secure `httpOnly` cookies on the gateway response (res.cookie(..., { httpOnly: true, secure: <env>, sameSite: <env> })).
     - Returns a minimal HTML page to the popup that instructs the opener to redirect to `/chat` and then close the popup.

3. Implementation hints:
   - Make sure [`tokens`](oAuth/src/controller/oauth.controller.js) returns tokens in the response body (JSON) when proxied through the gateway. Update it to `return res.status(200).json(new ApiResponse(200, { accessToken, refreshToken }, "Tokens"))`.
   - In the gateway, add a handler that calls the oAuth callback server-to-server via axios, extracts tokens, sets cookies:
     - Gateway app: [apiGateway/src/app.js](apiGateway/src/app.js)
     - Proxy file: [apiGateway/src/proxy.js](apiGateway/src/proxy.js)
     - Cookie options: in dev use `{ httpOnly: true, secure: false, sameSite: 'Lax' }`. In prod use `{ httpOnly: true, secure: true, sameSite: 'None' }`.
   - After cookies are set on the gateway response, return HTML that closes popup and redirects parent — the popup page should not render user details.

Files to modify (examples):
- Update [`tokens`](oAuth/src/controller/oauth.controller.js) to return tokens in response body (no user details printed).
- Add gateway callback endpoint in [apiGateway/src/proxy.js](apiGateway/src/proxy.js) before the proxy registrations to perform the server-to-server call and set cookies.

Notes:
- The gateway must have CORS configured with credentials: see [apiGateway/src/app.js](apiGateway/src/app.js) and `app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))`.
- Frontend should use `withCredentials: true` when calling API endpoints (see [frontend/src/feature/authSlice.js](frontend/src/feature/authSlice.js)).

Popup / postMessage fallback (if direct cookie set fails)
- The oAuth service can respond with a tiny HTML page that uses window.opener.postMessage to send tokens to the opener (frontend). The frontend receives tokens and calls the gateway `/set-cookie` endpoint (an endpoint on the gateway that sets httpOnly cookies). See example popup logic in [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx).

---

Troubleshooting & common pitfalls

- Cookies not set in browser:
  - Check cookie `secure` + `sameSite` flags. For local http non-HTTPS development, set secure: false and sameSite: 'Lax'. In production `secure: true` and `sameSite: 'None'`.
  - Ensure domain/origin matches where the frontend runs; cookies are set on the gateway's origin. Browser will ignore cross-site Set-Cookie unless SameSite=None + Secure and served over HTTPS.
  - In Chrome, check devtools Application → Cookies for the gateway origin.

- `req.user` is undefined in downstream services:
  - The API Gateway may add `x-user-id` header for proxied requests (see [apiGateway/src/proxy.js](apiGateway/src/proxy.js)). Downstream services must not rely on `req.user` being injected by gateway; rather use headers like `x-user-id` and middleware to fetch user (see [keyHandler/src/middleware/fetchUser.middleware.js](keyHandler/src/middleware/fetchUser.middleware.js)).

- Token refresh:
  - Refresh token flow happens in [generateToken/src/controller/token.controller.js](generateToken/src/controller/token.controller.js) — it must read incoming refresh token from cookie or body and lookup the user in DB (do not rely on `req.user` injected by gateway).

- Metrics errors:
  - If prom-client fails, check your metric definitions for malformed arrays (e.g., stray commas in buckets) — see [login/src/metrics.js](login/src/metrics.js), [generateToken/src/metrics.js](generateToken/src/metrics.js), etc.

---

Production architecture (design + components)

Goal: run TalkZ on AWS EKS with best practices: containerized microservices, Helm chart packaging, GitOps for deployment, security tooling, and observability stack.

Planned components:
- Kubernetes on EKS
  - Each microservice packaged as Docker image and deployed as a Kubernetes Deployment + Service.
  - Ingress: AWS ALB Ingress Controller or nginx-ingress for routing. The API Gateway will be the main ingress target for web traffic.

- Helm charts
  - Create a Helm chart repo for each microservice (or a parent umbrella chart).
  - Chart values: replica counts, resource requests/limits, env secrets (from AWS Secrets Manager), service type (ClusterIP), ingress annotations.

- GitOps with ArgoCD
  - GitOps setup: a `gitops` repo with Helm values and Kustomize overlays.
  - ArgoCD watches the repo and continuously deploys to EKS clusters.
  - Benefits: declarative, auditable, rollback.

- Security: Falco & runtime security
  - Falco deployed as a daemonset to monitor suspicious syscalls and container behavior.
  - Alerting integrated with Ops channel (e.g., Slack or PagerDuty).
  - Image scanning during CI (e.g., Trivy) to block vulnerable images.

- Observability: Prometheus + Grafana + Elastic (ELK)
  - Prometheus for metrics (services already use `prom-client`).
  - Grafana for dashboards and alerts (integrate Prometheus as data source).
  - ELK (Elasticsearch, Logstash, Kibana) for centralized logs:
    - Use Fluentd/Fluent Bit daemonset to ship logs to Elasticsearch.
    - Kibana for log exploration + alerting.

- Security Hardening
  - Network policies to restrict pod-to-pod communications.
  - PodSecurityAdmission or OPA/Gatekeeper policies to enforce security posture.
  - Use least-privilege IAM roles via IRSA on EKS.

- CI/CD & image registry
  - Build images using GitHub Actions / GitLab CI.
  - Push to a container registry (ECR or a private registry).
  - Helm charts published to a Helm repo or manage via GitOps.

---

IaC & orchestration: Terraform + Ansible + one-click redeploy

- Terraform (recommended):
  - Provision EKS cluster, VPC, subnets, IAM roles, ECR registries.
  - Manage cloud infra modules: networking, storage (EBS), load balancers.

- Ansible:
  - For post-provision tasks such as configuring bastion hosts, bootstrapping nodes, installing certificates, or orchestrating non-cloud resources.

- One-click redeploy:
  - Implement a CI/CD job (GitHub Action) that:
    1. Builds images and pushes to ECR.
    2. Updates Helm chart values (image tags) in GitOps repo.
    3. ArgoCD detects change and deploys.
  - Alternatively implement an admin script that triggers ArgoCD syncs for all apps (one-click redeploy).

---

Security & compliance notes

- Store secrets in AWS Secrets Manager or SSM Parameter Store; do NOT commit secrets to repo (check `.gitignore`).
- Use refresh token rotation: issue a new refresh token on refresh and invalidate the old one (this repo already saves refresh tokens per user).
- Use `httpOnly` cookies for tokens. Avoid exposing tokens to frontend JS.
- Ensure cookie `secure` and `SameSite=None` in prod behind HTTPS.

---

Appendix: env vars (high-level)

Each service expects `.env`/`env` values. Typical ones:
- MONGODB_URI
- PORT
- CORS_ORIGIN
- REDIS_IP, REDIS_PORT
- TOKEN_IP, TOKEN_SERVICE_SECRET, TOKEN_EXPIRY
- ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY
- FRONTEND_ORIGIN (for redirects)

Check the service `.env` files — example: [login/.env](login/.env), [oAuth/.env](oAuth/.env), [generateToken/.env](generateToken/.env).

---

References to code in this repository

- API Gateway
  - [apiGateway/src/index.js](apiGateway/src/index.js)
  - [apiGateway/src/app.js](apiGateway/src/app.js)
  - [apiGateway/src/proxy.js](apiGateway/src/proxy.js)

- OAuth
  - [oAuth/src/app.js](oAuth/src/app.js)
  - [oAuth/src/routes/oauth.route.js](oAuth/src/routes/oauth.route.js)
  - [`tokens`](oAuth/src/controller/oauth.controller.js) — token handler

- GenerateToken
  - [generateToken/src/app.js](generateToken/src/app.js)
  - [generateToken/src/controller/token.controller.js](generateToken/src/controller/token.controller.js)
  - [generateToken/src/routes/token.route.js](generateToken/src/routes/token.route.js)

- Login
  - [login/src/app.js](login/src/app.js)
  - [login/src/controller/login.controller.js](login/src/controller/login.controller.js)
  - [login/.env](login/.env)

- Frontend
  - [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx)
  - [frontend/src/main.jsx](frontend/src/main.jsx)

- Key handler
  - [keyHandler/src/routes/key.route.js](keyHandler/src/routes/key.route.js)
  - [keyHandler/src/controller/key.controller.js](keyHandler/src/controller/key.controller.js)
  - [keyHandler/src/middleware/fetchUser.middleware.js](keyHandler/src/middleware/fetchUser.middleware.js)
