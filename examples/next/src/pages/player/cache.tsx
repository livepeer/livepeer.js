import { Player } from '@livepeer/react';
import type { NextPage } from 'next';
import Head from 'next/head';
// import { useRouter } from 'next/router';

const mp4Url =
  'https://asset-cdn.lp-playback.monster/hls/89e8h99q7lu6u7qv/720p.mp4';

// type Path = {
//   id: string;
// };

// export async function getStaticPaths() {
//   return {
//     paths: [],
//     fallback: 'blocking',
//   };
// }

// export const getStaticProps = async (props: GetStaticPropsContext<Path>) => {
//   const dehydratedState = await prefetchPlayer(
//     { playbackId: props.params?.id },
//     { provider },
//   );

//   return {
//     props: {
//       dehydratedState,
//     },
//     revalidate: 600,
//   };
// };

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
