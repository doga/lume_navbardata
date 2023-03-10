// lume_navbardata

import * as path from "https://deno.land/std@0.167.0/path/mod.ts";
import { Site } from "lume/core.ts";
import YAML from 'https://cdn.skypack.dev/pin/yaml@v2.1.3-ntmfesRl3kdsLKTvvOl6/mode=imports,min/optimized/yaml.js';
import * as date from 'https://deno.land/std@0.160.0/datetime/mod.ts';
import { titleCase, lowerCase } from "https://deno.land/x/case@2.1.1/mod.ts";

import {Language} from './modules/language.ts';

type NavbarEntry = {title: string, path: string, order: number};
const pageFileExtensions: string[] = ['.yaml', '.yml', '.njk', '.md'];

export default 
function () {
  return (site: Site) => {
    // console.info(`ℹ️ navbardata: site: ${JSON.stringify(site)}`);

    const
    currentWorkingDirectoryAbs: string = site.options.cwd,
    projectSourceDirectory    : string = site.options.src,
    projectSourceDirectoryAbs : string = path.resolve(currentWorkingDirectoryAbs, projectSourceDirectory);

    for (const langDirEntry of Deno.readDirSync(projectSourceDirectoryAbs)) {
      if(!(langDirEntry.isDirectory && Language.exists(langDirEntry.name)))continue;

      // directory serves the site in this language: langDirEntry.name
      const
      langCode          : string        = langDirEntry.name,
      absLangDirname    : string        = path.resolve(projectSourceDirectoryAbs, langCode),
      absLangDataDirname: string        = path.resolve(absLangDirname, '_data'),
      navbarData        : NavbarEntry[] = []
      ;

      // generate the navbar data in memory
      for (const pageEntry of Deno.readDirSync(absLangDirname)) {
        const pageExtension = pageFileExtensions.find(ext => pageEntry.name.endsWith(ext));
        if(!pageExtension)continue;

        const 
        absPageFileName          : string        = path.resolve(absLangDirname, pageEntry.name),
        absPageFileInfo          : Deno.FileInfo = Deno.statSync(absPageFileName),
        pageBasename            : string         = path.basename(absPageFileName),
        pageNameWithoutExtension: string         = pageBasename.substring(0,pageBasename.length-pageExtension.length);

        if(!absPageFileInfo.isFile)continue;

        try {
          const 
          pageText: string = Deno.readTextFileSync(absPageFileName),
          frontMatter = YAML.parseDocument(pageText)?.toJS(),
          navbarOrder = frontMatter?.nav?.order; 
          if(typeof navbarOrder !== 'number')continue;

          navbarData.push({
            title: titleCase(pageNameWithoutExtension),
            path : lowerCase(pageNameWithoutExtension),
            order: navbarOrder
          });
  
        } catch (_error) {
          continue;
        }
      }
      navbarData.sort((a, b) => a.order - b.order);

      // ensure _data dir exists
      let absLangDataDirInfo: Deno.FileInfo;
      try {
        absLangDataDirInfo = Deno.statSync(absLangDataDirname);
      } catch (_error) {
        // _data does not exist
        Deno.mkdirSync(absLangDataDirname);
        absLangDataDirInfo = Deno.statSync(absLangDataDirname);
      }
      if(!absLangDataDirInfo.isDirectory)continue;

      // ensure navbar.yaml file does not exist
      const navbarYamlFilenameAbs = path.resolve(absLangDataDirname, 'navbar.yaml');
      try {
        const navbarYamlInfo = Deno.statSync(navbarYamlFilenameAbs);
        // navbar.yaml exists
        if(!navbarYamlInfo.isFile)continue;
        Deno.removeSync(navbarYamlFilenameAbs);
      } catch (_error) {
        // navbar.yaml does not exist
      }

      // write navbar.yaml
      try {
        const
        now       = new Date(),
        timestamp = date.format(now, "yyyy-MM-dd"),
        yaml      = YAML.stringify(navbarData);

        if(!yaml)throw new Error('');

        Deno.writeTextFileSync(
          navbarYamlFilenameAbs,
          `# This file was automatically generated at build time
# on ${timestamp} by the "lume_navbardata" Lume plugin.
${yaml}`);
      } catch (_error) {
        // should never happen
      }

    }

  };
}
