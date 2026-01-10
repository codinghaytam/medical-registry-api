# GitHub Secrets Reference

Set the following repository secrets in GitHub before running the CI/CD pipeline. All secrets are referenced by `.github/workflows/CICD.yml` unless noted otherwise.

| Secret | Required | Description |
| --- | --- | --- |
| `DOCKER_HUB_USERNAME` | Yes | Docker Hub account used by the build job. |
| `DOCKER_HUB_TOKEN` | Yes | Docker Hub access token/password. |
| `GCP_PROJECT_ID` | Yes | Google Cloud project where Terraform created the resources. |
| `GCP_REGION` | Yes | Cloud Run/Cloud SQL region (must match Terraform). |
| `GCP_SA_KEY` | Yes | Service-account JSON with `run.admin` and `iam.serviceAccountUser` permissions. |
| `KEYCLOAK_IMAGE` | No | Alternate Keycloak image tag (defaults to `quay.io/keycloak/keycloak:24.0.5`). |
| `KEYCLOAK_DB_USER` | Yes | Must match `keycloak_db_user` in `terraform.tfvars`. |
| `KEYCLOAK_DB_PASSWORD` | Yes | Must match `keycloak_db_password` in `terraform.tfvars`. |
| `KEYCLOAK_DB_NAME` | Yes | Must match `keycloak_db_name` in `terraform.tfvars`. |
| `KEYCLOAK_ADMIN_USERNAME` | Yes | Bootstrap admin user created by the deployment pipeline. |
| `KEYCLOAK_ADMIN_PASSWORD` | Yes | Password for the admin user above. |
| `API_DATABASE_URL` | Yes | Full Postgres URL the API should use (e.g., `postgresql://medical_app:pass@127.0.0.1:5432/medical_app_db`). |
| `KEYCLOAK_REALM` | Yes | Realm consumed by the API. |
| `KEYCLOAK_CLIENT_ID` | Yes | API client ID inside Keycloak. |
| `KEYCLOAK_CLIENT_SECRET` | Yes | Client secret associated with the ID above. |
| `ADMIN_USERNAME` | Yes | Application bootstrap admin account. |
| `ADMIN_PASSWORD` | Yes | Password for the bootstrap admin. |
| `CORS_ORIGINS` | No | Comma-separated origins (defaults to `*` if omitted). |
| `JWT_SECRET` | Yes | Secret used to sign JWTs. |
| `JWT_EXPIRES_IN` | Yes | JWT TTL string (e.g., `24h`). |
| `UPLOAD_BUCKET` | Yes | Cloud Storage bucket name created by Terraform. |
| `UPLOAD_PUBLIC_BASE_URL` | No | Base URL serving uploads; defaults to `https://storage.googleapis.com/<bucket>`. |
| `LOG_LEVEL` | No | Defaults to `info`. |
| `MAX_FILE_SIZE` | No | Defaults to `10MB`. |

> Tip: Terraform state and variables should be handled outside of GitHub Actions because the workflow no longer runs Terraform. Manage Cloud SQL credentials and other application-level secrets via Secret Manager or the Cloud Run console rather than GitHub secrets.
