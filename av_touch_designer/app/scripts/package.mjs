import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
await mkdir('../../downloads',{recursive:true});
// Standard-library ZIPs keep the standalone app and a source handoff together.
execFileSync('python3',['-c',`import zipfile
from pathlib import Path
root=Path('../..').resolve()
with zipfile.ZipFile(root/'downloads/AV-Touch-Designer-recovered.zip','w',zipfile.ZIP_DEFLATED) as z:
 for source,name in [('dist/AV-Touch-Designer.html','AV-Touch-Designer.html'),('README.md','README.md'),('recovered/LICENSES.txt','LICENSES.txt'),('../examples/sample-project-v2.json','sample-project-v2.json')]:
  z.write(source,name)
with zipfile.ZipFile(root/'downloads/AV-Touch-Designer-handoff-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for path in sorted((root/'av_touch_designer').rglob('*')):
  if path.is_file() and not any(part in path.relative_to(root).parts for part in ['node_modules','dist','test-results']):
   z.write(path,path.relative_to(root))
 z.write(root/'README.md','README.md')
for name in ['AV-Touch-Designer-recovered.zip','AV-Touch-Designer-handoff-source.zip']:
 with zipfile.ZipFile(root/'downloads'/name) as z:
  assert z.testzip() is None
  print(name,len(z.namelist()),'files verified')
`],{stdio:'inherit'});
