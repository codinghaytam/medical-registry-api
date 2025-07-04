# med
# med
# mefical-registry

# Medical Registry Backend

## Environment Configuration

This application uses environment variables for configuration. **Never commit production secrets to version control.**

### Setup Instructions

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables:**
   Edit `.env` file with your actual values:

   ```bash
   # Database connection
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
   
   # Server configuration
   PORT=3000
   NODE_ENV=development
   
   # Keycloak configuration
   KEYCLOAK_BASE_URL=http://localhost:9090
   KEYCLOAK_REALM=your-realm-name
   KEYCLOAK_CLIENT_ID=your-client-id
   KEYCLOAK_CLIENT_SECRET=your-client-secret
   
   # Admin credentials (for initial setup)
   ADMIN_USERNAME=admin@example.com
   ADMIN_PASSWORD=your-admin-password
   ```

### Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment mode | No | development |
| `KEYCLOAK_BASE_URL` | Keycloak server URL | Yes | - |
| `KEYCLOAK_REALM` | Keycloak realm name | Yes | - |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID | Yes | - |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret | Yes | - |
| `ADMIN_USERNAME` | Initial admin username | No | - |
| `ADMIN_PASSWORD` | Initial admin password | No | - |

### Security Notes

- **Never commit `.env` files** to version control
- Use different secrets for different environments
- Rotate secrets regularly in production
- Use strong, unique passwords
- Enable SSL/TLS in production environments

### Docker Development

For Docker development, ensure your `.env` file is properly configured:

```bash
# Start the development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the environment
docker-compose down
```

### Production Deployment

For production deployments:

1. Set environment variables through your deployment platform
2. Never use the development `.env` file in production
3. Use secrets management tools when available
4. Enable proper logging and monitoring

---
