import { useCallback, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';

import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleSearchNextPage = useCallback(() => {
    fetch(nextPage)
      .then(response => response.json())
      .then(response => {
        response.results.forEach((post: Post) => {
          const newPost = {
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };

          setPosts([...posts, newPost]);
        });

        setNextPage(response.next_page);
      });
  }, [posts, nextPage]);

  return (
    <>
      <Head>
        <title>Home | spacetraveling.</title>
      </Head>
      <Header />
      <main className={commonStyles.container}>
        {posts.map(post => (
          <Link href={`post/${post.uid}`} key={post.uid}>
            <a className={styles.post}>
              <strong>{post.data.title}</strong>

              <p>{post.data.subtitle}</p>

              <footer>
                <div>
                  <FiCalendar size={20} color="#D7D7D7" />
                  <span>
                    {format(
                      new Date(post.first_publication_date),
                      'd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
                </div>
                <div>
                  <FiUser size={20} color="#D7D7D7" />
                  <span>{post.data.author}</span>
                </div>
              </footer>
            </a>
          </Link>
        ))}

        <footer className={styles.loadPostsButton}>
          {nextPage && (
            <button type="button" onClick={handleSearchNextPage}>
              Carregar mais posts
            </button>
          )}
        </footer>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: [
        'post.title',
        'post.subtitle',
        'post.author',
        'post.first_publication_date',
      ],
      pageSize: 5,
    }
  );

  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results,
      },
    },
    revalidate: 60 * 60 * 24,
  };
};
