import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/quickstart">
            Get Started - 5min ⏱️
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <div className="col col--4">
            <div className="text--center padding-horiz--md">
              <Heading as="h3">🚀 Quick Start</Heading>
              <p>
                Get up and running in minutes. Create your first simulation with just a few API calls.
              </p>
              <Link to="/docs/getting-started/quickstart">
                View Quickstart →
              </Link>
            </div>
          </div>
          <div className="col col--4">
            <div className="text--center padding-horiz--md">
              <Heading as="h3">📚 Comprehensive Guides</Heading>
              <p>
                Learn best practices for simulations, scenarios, and configuration management.
              </p>
              <Link to="/docs/guides/create-simulation">
                Explore Guides →
              </Link>
            </div>
          </div>
          <div className="col col--4">
            <div className="text--center padding-horiz--md">
              <Heading as="h3">🔌 API Reference</Heading>
              <p>
                Complete API documentation with interactive examples you can try right in your browser.
              </p>
              <Link to="/docs/api-reference">
                Browse API →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Comprehensive API documentation for Twyn - Build powerful agent-based simulations">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
