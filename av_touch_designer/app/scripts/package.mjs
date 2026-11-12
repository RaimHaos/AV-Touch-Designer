import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
await mkdir('../../downloads',{recursive:true});
// Python's standard library creates ZIP without introducing runtime dependencies.
execFileSync('python3',['-c',`import zipfile
from pathlib import Path
with zipfile.ZipFile('../../downloads/AV-Touch-Designer-recovered.zip','w',zipfile.ZIP_DEFLATED) as z:
 for source,name in [('dist/AV-Touch-Designer.html','AV-Touch-Designer.html'),('README.md','README.md'),('recovered/LICENSES.txt','LICENSES.txt'),('../examples/sample-project-v2.json','sample-project-v2.json')]:
  z.write(source,name)
`]);
console.log('downloads/AV-Touch-Designer-recovered.zip');
