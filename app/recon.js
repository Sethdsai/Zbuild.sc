const { execSync } = require('child_process');

try {
  const tokenStr = execSync('curl -s -X GET -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token').toString();
  const token = JSON.parse(tokenStr).access_token;
  const project = execSync('curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/project/project-id').toString().trim();
  
  console.log(`Checking permissions for project: ${project}`);
  
  // Try IAM Policy check
  const iamCmd = `curl -s -X POST -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '{"permissions": ["compute.instances.create", "run.services.create", "iam.serviceAccounts.actAs"]}' https://cloudresourcemanager.googleapis.com/v1/projects/${project}:testIamPermissions`;
  const iamRes = execSync(iamCmd).toString();
  console.log('--- IAM Test Permissions ---');
  console.log(iamRes);
  
} catch(e) {
  console.log('Error:', e.message);
}
