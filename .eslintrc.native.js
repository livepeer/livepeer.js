// from https://github.com/jsx-eslint/eslint-plugin-react/blob/master/lib/rules/no-invalid-html-attribute.js
const HTML_ELEMENTS = new Set([
  'a',
  'abbr',
  'acronym',
  'address',
  'applet',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'basefont',
  'bdi',
  'bdo',
  'bgsound',
  'big',
  'blink',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'center',
  'cite',
  'code',
  'col',
  'colgroup',
  'content',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'dir',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'font',
  'footer',
  'form',
  'frame',
  'frameset',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  'image',
  'img',
  'input',
  'ins',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'marquee',
  'math',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'nobr',
  'noembed',
  'noframes',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'plaintext',
  'portal',
  'pre',
  'progress',
  'q',
  'rb',
  'rp',
  'rt',
  'rtc',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'shadow',
  'slot',
  'small',
  'source',
  'spacer',
  'span',
  'strike',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'svg',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'tt',
  'u',
  'ul',
  'var',
  'video',
  'wbr',
  'xmp',
]);

module.exports = {
  extends: './.eslintrc.js',
  plugins: ['react-native', '@react-native-community'],

  env: {
    'react-native/react-native': true,
  },

  rules: {
    '@react-native-community/platform-colors': 2,
    'react-native/no-color-literals': 2,
    'react-native/no-inline-styles': 2,
    // 'react-native/no-raw-text': 2, re-enable when this is fixed: https://github.com/Intellicode/eslint-plugin-react-native/issues/270
    'react-native/no-single-element-style-arrays': 2,
    'react-native/no-unused-styles': 2,
    'react-native/sort-styles': 2,
    'react-native/split-platform-components': 2,

    'react/forbid-elements': [
      2,
      {
        forbid: [...HTML_ELEMENTS].map((element) => ({
          element,
          message: 'cannot use DOM elements in React Native',
        })),
      },
    ],

    // we temporarily disable imports until this is refactored
    'no-restricted-imports': [
      2,
      'livepeer/media/controls',
      'livepeer/media/hls',
      'livepeer/styling',
    ],
  },
};
