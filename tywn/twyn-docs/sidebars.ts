import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/quickstart',
        'getting-started/authentication',
        'getting-started/making-requests',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/create-simulation',
        'guides/polling-results',
        'guides/managing-scenarios',
        'guides/config-management',
      ],
    },
    {
      type: 'category',
      label: 'Concepts',
      items: [
        'concepts/simulation-lifecycle',
        'concepts/status-states',
        'concepts/data-models',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/curl',
        'examples/python',
        'examples/javascript',
        'examples/typescript',
      ],
    },
  ],
};

export default sidebars;
