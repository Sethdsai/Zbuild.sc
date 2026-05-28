import { execSync } from 'child_process';
try {
  const tokenStr = execSync('curl -s -X GET -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token').toString();
  const token = JSON.parse(tokenStr).access_token;
  const project = execSync('curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/project/project-id').toString().trim();
  console.log(`Checking permissions for project: ${project}`);
  const gceCmd = `curl -s -H "Authorization: Bearer ${token}" https://compute.googleapis.com/compute/v1/projects/${project}/zones/asia-east1-a/instances`;
  console.log('--- Compute API ---');
  console.log(execSync(gceCmd).toString());
} catch(e) { console.log('Error:', e.message); }
