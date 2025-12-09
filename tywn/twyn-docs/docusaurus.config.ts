import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Twyn API Documentation',
  tagline: 'Build powerful agent-based simulations',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.twyn.it',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  // GitHub pages deployment config
  organizationName: 'twyn',
  projectName: 'twyn-docs',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Remove edit URL as it's an API docs site
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: "api",
        docsPluginId: "classic",
        config: {
          twyn: {
            specPath: "https://api.twyn.it/openapi.json",
            outputDir: "docs/api-reference",
            sidebarOptions: {
              groupPathsBy: "tag",
              categoryLinkSource: "tag",
            },
          } satisfies import('docusaurus-plugin-openapi-docs').OpenApiOptions,
        }
      },
    ]
  ],

  themes: [
    "docusaurus-theme-openapi-docs",
    "@docusaurus/theme-mermaid"
  ],

  markdown: {
    mermaid: true,
  },

  themeConfig: {
    image: 'img/twyn-social-card.png',
    navbar: {
      title: 'Twyn',
      logo: {
        alt: 'Twyn Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/api-reference',
          label: 'API Reference',
          position: 'left',
        },
        {
          href: 'https://twyn.it',
          label: 'Dashboard',
          position: 'right',
        },
        {
          href: 'https://github.com/twyn',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/quickstart',
            },
            {
              label: 'API Reference',
              to: '/docs/api-reference',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/twyn',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Dashboard',
              href: 'https://twyn.it',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Twyn. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'python', 'typescript', 'javascript'],
    },
    languageTabs: [
      {
        highlight: "bash",
        language: "curl",
        logoClass: "bash",
      },
      {
        highlight: "python",
        language: "python",
        logoClass: "python",
      },
      {
        highlight: "javascript",
        language: "nodejs",
        logoClass: "nodejs",
      },
      {
        highlight: "typescript",
        language: "typescript",
        logoClass: "typescript",
      },
    ],
  } satisfies Preset.ThemeConfig,
};

export default config;
