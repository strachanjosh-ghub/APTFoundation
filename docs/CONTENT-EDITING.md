# Content editing guide

All content lives in `/content` as JSON objects validated by `src/lib/schemas.ts`. There is no custom admin interface. Editors use GitHub's web editor or any text editor, or a headless CMS once one is connected (below).

## Where things are

| To change… | Edit |
|---|---|
| A page's text, sections or order | `content/pages/<id>.json` → `hero`, `contentBlocks[]` (reorder the array to reorder sections) |
| A cause | `content/causes/<slug>.json` (`description` is rich HTML; `quote` is the card and aside quote; `order` sets the listing order) |
| A news article | `content/articles/<slug>.json` (`body` is rich HTML) |
| Navigation and footer links | `content/site.json` → `navigation.primary`, `footer.links` |
| Partner brand logos | `content/site.json` → `partnerBrands` |
| Contact details and form labels | `content/site.json` → `contact` |
| Donation amounts, labels, matching statement | `content/site.json` → `donation` |
| Default SEO | `content/site.json` → `seo`; per object → `seo` |
| Brand name, logo, colours, fonts | `config/brand.ts` (developer-owned) |

## Common tasks

- **Add a news article**: copy an existing file in `content/articles/`, change `id`, `slug` and `path` (`/one-tomorrow/posts/<slug>`), `title`, `publishedDate` (ISO), `body` and `heroImage`. It appears on `/news` and the homepage feed automatically.
- **Add a cause**: copy a cause file, set a unique `slug` and `order`, and set `path` to `/t/<slug>`. It appears on `/causes` automatically. Add it to the Causes menu in `site.json` if wanted.
- **Unpublish**: set `"status": "draft"`.
- **Images**: put files in `public/media/` and reference them as `{ "src": "/media/file.jpg", "alt": "Describe the image" }`. Always write alt text for meaningful images; use `""` only for decorative ones.

## Checks before publishing

```bash
npm run validate:content   # schema + links + media
npm test
```

Note: the fidelity check compares content with the original OneTomorrow snapshot. Once editors deliberately change migrated text (for example rebranding the copy), mark the changed objects as intentionally edited by removing them from the fidelity suite, or retire the suite.

## Migrating to a headless CMS

The schemas map one-to-one to CMS models. Create models `page`, `cause`, `article` and the singleton `site`, with `contentBlocks` as a modular/portable-text field using the block types in `ContentBlock`. Import the JSON files, then reimplement the functions in `src/lib/content.ts` (`getPages`, `getCause`, …) against the CMS API, keeping the same return types. No page or component changes are needed.
