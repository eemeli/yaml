## YAML Docs

These documentation source files are compiled into [eemeli.org/yaml](https://eemeli.org/yaml) using a [Slate](https://github.com/slatedocs/slate) instance that's a git submodule of this repo at `docs-slate/`.

### How to Preview Changes

1. Modify these source files, noting that sections are defined in `index.html.md`
2. Make sure that the Slate submodule is properly initialised. If you've just cloned the repo, the command you'll want is `git submodule update --init`
3. Note that `docs-slate/source` contains symlinks to this folder, which may need extra configuration to work in Windows environments
4. See [docs-slate/README.md](../docs-slate/README.md) for its install instructions
5. Use `npm run docs` from this repo's root to preview the site at http://localhost:4567

### How to Publish Changes

In addition to the preview steps:

1. Add this repo as the "yaml" remote for the `docs-slate` submodule repo: `git remote add yaml git@github.com:eemeli/yaml.git`
2. Run the `deploy.sh` script from the `docs-slate` folder
