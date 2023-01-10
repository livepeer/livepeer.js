import { Player, prefetchPlayer } from '@livepeer/react';
import type { GetStaticPropsContext, NextPage } from 'next';
import Head from 'next/head';
// import { useRouter } from 'next/router';

import { provider } from '../../utils';

const mp4Url =
  'https://file-examples.com/storage/fea8fc38fd63bc5c39cf20b/2017/04/file_example_MP4_1920_18MG.mp4';

type Path = {
  id: string;
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export const getStaticProps = async (props: GetStaticPropsContext<Path>) => {
  const dehydratedState = await prefetchPlayer(
    { playbackId: props.params?.id },
    { provider },
  );

  return {
    props: {
      dehydratedState,
    },
    revalidate: 600,
  };
};

const PlayerPage: NextPage = () => {
  // const { query } = useRouter();

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        backgroundColor: '#000',
      }}
    >
      <Head>
        <link rel="preload" as="video" href={mp4Url} />
      </Head>
      <Player
        objectFit="contain"
        src={mp4Url}
        muted
        // autoPlay
        theme={{
          radii: {
            containerBorderRadius: '0px',
          },
        }}
      />
    </div>
  );
};

export default PlayerPage;
