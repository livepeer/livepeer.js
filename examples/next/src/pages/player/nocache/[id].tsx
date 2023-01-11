import type { GetStaticPropsContext, NextPage } from 'next';
import { useEffect, useRef } from 'react';

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
    fallback: false,
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

  useEffect(() => {
    const mediaElement = ref.current;

    const canplay = () => console.log(`canplay: ${Date.now() - initial}`);
    const loadeddata = () => console.log(`loadeddata: ${Date.now() - initial}`);
    const loadedmetadata = () =>
      console.log(`loadedmetadata: ${Date.now() - initial}`);

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
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        backgroundColor: '#000',
      }}
    >
      <p>No Cache</p>
      <video
        ref={ref}
        style={{ width: '100%', height: '100%' }}
        title="No Cache"
        src={url}
        muted
        controls
      />
    </div>
  );
};

export default PlayerPage;
