# lume_navbardata

A [Lume](https://lume.land) plugin for developing multi-language websites.
Lume is a static-site generator for the [Deno](https://deno.land) JavaScript/TypeScript runtime.

lume_navbardata creates [shared data for Lume projects](https://lume.land/docs/creating-pages/shared-data/#the-_data-directories) in order to automate the generation of visual navigation bars. These navigation bars are frequently displayed on top of web pages as a set of links.

## Usage

Call lume_navbardata from your [Lume project's configuration file](https://lume.land/docs/configuration/config-file/):

```ts
// _config.ts

import lume from 'lume/mod.ts';
import lume_navbardata from 'lume_navbardata/mod.ts';

export default
lume({
  location: new URL('https://site.example'),
  src     : './src',
  dest    : './build',
})
.use(lume_navbardata());
```

Don't forget to define the `lume_navbardata/` import prefix in your lume project's `import_map.json` file:

```json
{
  "imports": {
    "lume/"           : "https://deno.land/x/lume@v1.14.2/",
    "lume_navbardata/": "https://deno.land/x/lume_navbardata@v1.0.10/",
  }
}
```

`lume_navbardata@v1.x.x` versions are compatible with `lume@v1.x.x` versions from `lume@v1.13.x` upwards.

## Lume project directory structure

lume_navbardata assumes that your [Lume project's source directory](https://lume.land/docs/configuration/config-file/#src) contains one directory per language. The directory name must be a [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes). lume_navbardata will ignore directories with a non-conforming name. Note that the names of the language directories must be lower-cased.

For example, if your source directory contains the following directories and files:

- `en`
- `tr`
- `assets`
- `index.html`

then lume_navbardata will ignore the `assets` directory and the `index.html` file.

Within a language directory, lume_navbardata assumes that each link in the navigation bar corresponds to a [page](https://lume.land/docs/creating-pages/page-files/) in the language directory. lume_navbardata will only consider pages:

- that have the `.yaml`, `.yml`, `.md` or `.njk` filename extensions, and
- whose [front matter](https://lume.land/docs/getting-started/page-data/) contains a `nav.order` entry which is an integer or floating point number that defines the display order in the navigation bar.

For example, if the `en` directory contains these pages:

- `documentation.yaml`
- `about.njk`
- `bug-fix-b2345.yaml`

and if only `documentation.yaml` and `about.njk` have `nav.order` in their front matter, then the `bug-fix-b2345.yaml` page will be ignored by lume_navbardata.

Example of valid front matter:

```yaml
nav:
  order: 1
```

## Which shared data is generated?

Given the source directory structure shown above, lume_navbardata will generate the following data files:

- `en/_data/navbar.yaml`
- `tr/_data/navbar.yaml`

For example, `en/_data/navbar.yaml` will be similar to this:

```yaml
- title: Documentation
  path: documentation
  order: 1
- title: About
  path: about
  order: 2
```

Note that:

- in these data files both the title and the path are inferred from the page's filename.
- the generated data files will modify your source directory.

## Using navbar data in Lume layouts

Here is how the navbar data can be used in [Lume layouts](https://lume.land/docs/getting-started/create-a-layout/) for generating navigation bars:

```html
<!DOCTYPE html>
<html lang="{{ lang.code }}">
<head>
  <!-- ... -->
</head>
<body>
  <header>
    <nav>
      <ul>
        <li>
          <a href="/{{ lang.code }}/" aria-label="Return home">
            Site name
          </a>
        </li>

        {% for item in navbar %}
        <li>
          <a 
            href="/{{ lang.code }}/{{ item.path }}/"

            {% if nav.selection == item.path %}
            class="selected"
            {% endif %}
          >
            {{ item.title }}
          </a>
        </li>
        {% endfor %}

      </ul>
    </nav>
  </header>

  <!-- ... -->
</body>
</html>
```

Note that:

- pages can indicate their path in their front matter (here in the `nav.selection` property) so that the current item in the navigation bar can be highlighted.
- if you wish to select the same navigation bar item for several pages then all these pages should have the same `nav.selection` value; for example `src/docs.yaml` and `src/specification.yaml` can both have the same `nav.selection` value which equals to `docs`, but only one of them must have a `nav.order` property and only a link to that page (for example `src/docs.yaml`) will be displayed in the navigation bar.
- in this example `lang.code` isn't generated by lume_navbardata but by another Lume plugin called [lume_langdata](https://github.com/doga/lume_langdata)).

## Other relevant Lume add-ons

If you are developing multi-language sites, the following Lume plugin and add-on are a nice complement to lume_navbardata:

- [lume_langdata](https://deno.land/x/lume_langdata)
- [lume_cross_language_content](https://deno.land/x/lume_cross_language_content)

## Demo

[This website project](https://github.com/doga/qworum-website) uses Lume and lume_navbardata.

## License

lume_navbardata is released under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).
