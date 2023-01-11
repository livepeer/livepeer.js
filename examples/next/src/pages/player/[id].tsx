import type { GetStaticPropsContext, NextPage } from 'next';
import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';

const mp4Url = 'https://asset-cdn.lp-playback.monster/hls/89e8h99q7lu6u7qv';

type Path = {
  id: string;
};

export async function getStaticPaths() {
  return {
    paths: [
      { params: { id: '720p' } },
      { params: { id: '540p' } },
      { params: { id: '720p-fast-start' } },
      { params: { id: '540p-fast-start' } },
    ],
    fallback: 'blocking',
  };
}

export const getStaticProps = async (props: GetStaticPropsContext<Path>) => {
  return {
    props: { url: `${mp4Url}/${props.params?.id}.mp4` },
    revalidate: 600,
  };
};

const initial = Date.now();

const PlayerPage: NextPage<{ url: string }> = ({ url }) => {
  const ref = useRef<HTMLVideoElement | null>(null);

  const [canPlay, setCanPlay] = useState('');
  const [loadedData, setLoadedData] = useState('');
  const [loadedMetadata, setLoadedMetadata] = useState('');

  useEffect(() => {
    const mediaElement = ref.current;

    const canplay = () => setCanPlay(`canplay: ${Date.now() - initial}`);
    const loadeddata = () =>
      setLoadedData(`loadeddata: ${Date.now() - initial}`);
    const loadedmetadata = () =>
      setLoadedMetadata(`loadedmetadata: ${Date.now() - initial}`);

    mediaElement?.addEventListener('canplay', canplay);
    mediaElement?.addEventListener('loadeddata', loadeddata);
    mediaElement?.addEventListener('loadedmetadata', loadedmetadata);

    return () => {
      mediaElement?.removeEventListener('canplay', canplay);
      mediaElement?.removeEventListener('loadeddata', loadeddata);
      mediaElement?.removeEventListener('loadedmetadata', loadedmetadata);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
        backgroundColor: '#000',
      }}
    >
      <Head>
        <link rel="preload" as="video" href={url} />
      </Head>
      <p style={{ color: 'white' }}>{canPlay}</p>
      <p style={{ color: 'white' }}>{loadedData}</p>
      <p style={{ color: 'white' }}>{loadedMetadata}</p>
      <video
        ref={ref}
        style={{ width: '100%' }}
        title="Cache"
        src={url}
        muted
        preload="auto"
        controls
      />
    </div>
  );
};

export default PlayerPage;
