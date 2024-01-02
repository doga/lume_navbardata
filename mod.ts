// lume_navbardata

// external dependencies
import {path, YAML, date, Lang, titleCase, lowerCase, Frontmatter} from './deps.ts'; 

type InputNavbarInfo = {selection: string, order?: number};
type FrontmatterData = Record<string, unknown>;
type OutputNavbarEntry = {title: string, path: string, order: number};
// type YamlSimpleData = string | number | boolean | null | undefined;
// type YamlData = Record<string,  unknown>;
const pageFileExtensions: string[] = ['.yaml', '.yml', '.njk', '.md', '.vto'];

export default 
function () {
  return (site: Lume.Site) => {
    console.info(`ℹ️ navbardata: site: ${JSON.stringify(site)}`);

    const
    currentWorkingDirectoryAbs: string = site.options.cwd,
    projectSourceDirectory    : string = site.options.src,
    projectSourceDirectoryAbs : string = path.resolve(currentWorkingDirectoryAbs, projectSourceDirectory);

    for (const langDirEntry of Deno.readDirSync(projectSourceDirectoryAbs)) {
      if(!(langDirEntry.isDirectory && Lang.getLanguageInfo(langDirEntry.name)))continue;

      // directory serves the site in this language: langDirEntry.name
      const
      langCode          : string              = langDirEntry.name,
      absLangDirname    : string              = path.resolve(projectSourceDirectoryAbs, langCode),
      absLangDataDirname: string              = path.resolve(absLangDirname, '_data'),
      navbarData        : OutputNavbarEntry[] = []
      ;

      // generate the navbar data in memory
      for (const pageEntry of Deno.readDirSync(absLangDirname)) {
        const pageExtension = pageFileExtensions.find(ext => pageEntry.name.endsWith(ext));
        if(!pageExtension)continue;

        const 
        absPageFileName         : string        = path.resolve(absLangDirname, pageEntry.name),
        absPageFileInfo         : Deno.FileInfo = Deno.statSync(absPageFileName),
        pageBasename            : string        = path.basename(absPageFileName),
        pageNameWithoutExtension: string        = pageBasename.substring(0,pageBasename.length-pageExtension.length);

        if(!absPageFileInfo.isFile)continue;
        console.debug(`ℹ️ navbardata: page: ${langCode}/${pageEntry.name}`);

        const pageText    = Deno.readTextFileSync(absPageFileName);
        let frontMatter: FrontmatterData = {};

        try {
          frontMatter = Frontmatter.extract(pageText).attrs as FrontmatterData;
        } catch (_error) {
          // the document may be plain YAML 
          try {
            frontMatter = YAML.parse(pageText) as FrontmatterData;
          } catch (_error) {
            console.debug(`navbardata: error ${_error}`);
            continue;
          }
        }

        const navbarOrder = (frontMatter?.nav as InputNavbarInfo)?.order;
        console.debug(`navbardata: frontmatter: ${JSON.stringify(frontMatter)}`);
        if(typeof navbarOrder !== 'number')continue;

        navbarData.push({
          title: titleCase(pageNameWithoutExtension),
          path : lowerCase(pageNameWithoutExtension),
          order: navbarOrder
        });
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
        yaml      = YAML.stringify({list: navbarData});

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
