import sanitizeHtml from 'sanitize-html';

/**
 * Defence-in-depth sanitiser for CMS rich text. Allows the formatting the
 * source content uses (headings, lists, emphasis, links, images, tables) and
 * strips scripts, inline handlers and styles.
 */
export function safeHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 'sup', 'sub', 'a', 'img', 'blockquote', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'],
    allowedAttributes: { a: ['href', 'target', 'rel', 'title'], img: ['src', 'alt', 'width', 'height', 'loading'], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan', 'scope'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: attribs.target === '_blank' ? { ...attribs, rel: 'noopener noreferrer' } : attribs }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy', alt: attribs.alt ?? '' } }),
    },
  });
}
