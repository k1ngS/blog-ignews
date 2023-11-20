import { render, screen } from '@testing-library/react'
import {  mocked } from 'jest-mock'
import Post, { getServerSideProps } from '../../pages/posts/[slug]'
import { createClient } from '../../services/prismic'
import { getSession } from 'next-auth/react';

const post = 
  {
    slug: 'fake-slug',
    title: 'My new post',
    content: '<p>Post excerpt</p>',
    updatedAt: '31 de dezembro de 2019'
  };


jest.mock('next-auth/react')
jest.mock('../../services/prismic');

describe('Post page', () => {
  it('renders correctly', () => {
    render(<Post post={post}/>)

    expect(screen.getByText("My new post")).toBeInTheDocument();
    expect(screen.getByText("Post excerpt")).toBeInTheDocument();
  });

  it('redirects user if no subscription is found', async () => {
    const getSessionMocked = mocked(getSession);
    
    getSessionMocked.mockResolvedValueOnce({
      activeSubscription: null,
    }as any)

    const response = await getServerSideProps({ params: { slug: 'my-new-post' } } as any)

    expect(response).toEqual(
      expect.objectContaining({
        redirect: expect.objectContaining({
          destination: '/',
        })
      })
    );
  });

  it('loads initial data', async () => {
    const getSessionMocked = mocked(getSession);
    const getPrismicClientMocked = mocked(createClient);

    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title: [
            { type: 'heading', text: 'My new post' }
          ],
          content: [
            { type: 'paragraph', text: 'Post content' }
          ],
        },
        last_publication_date: '04-01-2021',
      })
    }as any)

    getSessionMocked.mockResolvedValueOnce({
      activeSubscription: 'fake-active-subscription',
    }as any)

  const response = await getServerSideProps({ params: { slug: 'my-new-post' } } as any)

    expect(response).toEqual(
      expect.objectContaining({
        props: {
          post: {
            slug: 'my-new-post',
            title: 'My new post',
            content: '<p>Post content</p>',
            updatedAt: '01 de abril de 2021'
          }
        }
      })
    );
  });
});