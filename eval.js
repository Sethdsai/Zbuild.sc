const { execSync } = require('child_process');
try {
  const tokenStr = execCync('curl -s -X GET -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token').toString();
  const token = JSON.parse(tokenStr).access_token;
  const project = execSync('curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/project/project-id').toString().trim();
  console.log(`Project: ${project}`);
  const iamCmd = `curl -s -X POST -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '{"permissions": ["compute.instances.create", "run.services.create", "run.services.update", "iam.serviceAccounts.actAs", "run.jobs.create"]}' https://cloudresourcemanager.googleapis.com/v1/projects/${project}:testIamPermissions`;
  console.log(execSync(iamCmd).toString());
} catch(e) { console.log(e.message); }