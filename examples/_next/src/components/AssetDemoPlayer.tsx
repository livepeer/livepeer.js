import { Player } from '@livepeer/react';
import Head from 'next/head';
import { useCallback } from 'react';

const mp4Url =
  'https://file-examples.com/storage/fea8fc38fd63bc5c39cf20b/2017/04/file_example_MP4_1920_18MG.mp4';
// const streamId = '2c61917e-4f05-449a-ab7d-1b3c85f78993';

export const AssetDemoPlayer = () => {
  const mediaElementRef = useCallback((ref: HTMLMediaElement) => {
    console.log(ref.duration);
  }, []);

  return (
    <>
      {/* Added scrolling to test priority... */}
      {/* <div style={{ height: 2000 }} /> */}
      <Head>
        <link rel="preload" as="video" href={mp4Url} />
      </Head>
      <Player
        src={mp4Url}
        // autoUrlUpload={{
        //   fallback: true,
        //   ipfsGateway: 'https://lens.infura-ipfs.io/',
        // }}
        priority
        loop
        showPipButton
        mediaElementRef={mediaElementRef}
        controls={{
          defaultVolume: 0.7,
        }}
        theme={{
          fonts: {
            display: 'Inter',
          },
          colors: {
            accent: '#72DDF7',
            progressLeft: '#F7AEF8',
            progressMiddle: '#F7AEF8',
            progressRight: '#F7AEF8',
            progressThumb: '#F4F4ED',
          },
          // radii: { containerBorderRadius: '30px' },
          // space: {
          //   controlsTopMarginX: '20px',
          //   controlsTopMarginY: '15px',
          //   controlsBottomMarginX: '15px',
          //   controlsBottomMarginY: '10px',
          // },
        }}
      />
    </>
  );
};
