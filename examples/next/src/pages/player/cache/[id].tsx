import { Player } from '@livepeer/react';
import type { GetStaticPropsContext, NextPage } from 'next';

const mp4Url = 'https://asset-cdn.lp-playback.monster/hls/89e8h99q7lu6u7qv';

type Path = {
  id: string;
};

export async function getStaticPaths() {
  return {
    paths: [
      { params: { id: '720p.mp4' } },
      { params: { id: '540p.mp4' } },
      { params: { id: '720p-fast-start.mp4' } },
      { params: { id: '540p-fast-start.mp4' } },
    ],
    fallback: false,
  };
}

export const getStaticProps = async (props: GetStaticPropsContext<Path>) => {
  return {
    props: { url: `${mp4Url}/${props.params?.id}` },
    revalidate: 600,
  };
};

const PlayerPage: NextPage<{ url: string }> = ({ url }) => {
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
      <Player objectFit="contain" src={url} muted autoPlay priority />
    </div>
  );
};

export default PlayerPage;
