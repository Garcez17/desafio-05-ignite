import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import Head from 'next/head';
import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const readTime = useMemo(() => {
    let total = 0;

    post.data.content.forEach(item => {
      const wordsPerParagraph = item.body.map(
        text => text.text.split(' ').length
      );

      wordsPerParagraph.forEach(words => {
        total += words;
      });
    });

    const words = total / 200;

    return Math.ceil(words);
  }, [post.data.content]);

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <Header />
      <div className={styles.container}>
        <img src={post.data.banner.url} alt="banner" />
        <main className={commonStyles.container}>
          <h1>{post.data.title}</h1>
          <div className={styles.infoPost}>
            <span>
              <FiCalendar size={20} color="#D7D7D7" />
              {format(new Date(post.first_publication_date), 'd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
            <span>
              <FiUser size={20} color="#D7D7D7" />
              {post.data.author}
            </span>
            <span>
              <FiClock size={20} color="#D7D7D7" />
              {readTime} min
            </span>
          </div>

          <div className={styles.postContent}>
            {post.data.content.map(item => (
              <div key={item.heading}>
                <header>
                  <strong>{item.heading}</strong>
                </header>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(item.body),
                  }}
                />
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
      subtitle: response.data.subtitle,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 24,
  };
};
