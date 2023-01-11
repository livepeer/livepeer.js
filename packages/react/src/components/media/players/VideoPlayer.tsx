import { VideoPlayerProps } from '@livepeer/core-react/components';
import { MediaControllerState } from 'livepeer';
import {
  addMediaMetricsToInitializedStore,
  canPlayMediaNatively,
} from 'livepeer/media/browser';
import { styling } from 'livepeer/media/browser/styling';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { MediaControllerContext, useMediaController } from '../../../context';
import { PosterSource } from '../Player';

const mediaControllerSelector = ({
  fullscreen,
}: MediaControllerState<HTMLMediaElement>) => ({
  fullscreen,
});

export type { VideoPlayerProps };

export const VideoPlayer = React.forwardRef<
  HTMLVideoElement,
  VideoPlayerProps<HTMLVideoElement, PosterSource>
>(
  (
    {
      src,
      autoPlay,
      title,
      loop,
      muted,
      poster,
      objectFit,
      priority,
      onMetricsError,
    },
    ref,
  ) => {
    const { fullscreen } = useMediaController(mediaControllerSelector);

    const filteredSources = React.useMemo(
      () => src?.filter((s) => s?.mime && canPlayMediaNatively(s)),
      [src],
    );

    const store = React.useContext(MediaControllerContext);

    React.useEffect(() => {
      const { destroy } = addMediaMetricsToInitializedStore(
        store,
        filteredSources?.[0]?.src,
        (e) => {
          onMetricsError?.(e as Error);
          console.error('Not able to report player metrics', e);
        },
      );

      return destroy;
    }, [onMetricsError, store, filteredSources]);

    return (
      <video
        className={styling.media.video({
          size: fullscreen ? 'fullscreen' : objectFit,
        })}
        loop={loop}
        aria-label={title ?? 'Video player'}
        role="video"
        autoPlay={autoPlay}
        width="100%"
        height="100%"
        ref={ref}
        webkit-playsinline="true"
        playsInline
        muted={muted}
        poster={typeof poster === 'string' ? poster : undefined}
        preload={priority ? 'auto' : 'none'}
      >
        {createPortal(
          <>
            {filteredSources?.[0]?.mime && (
              <link
                rel="preload"
                as="video"
                href={filteredSources[0].src}
                type={filteredSources[0].mime}
              />
            )}
          </>,
          document.head,
        )}
        {filteredSources?.map((source) => (
          <source key={source.src} src={source.src} type={source.mime!} />
        ))}
        {
          "Your browser doesn't support the HTML5 <code>video</code> tag, or the video format."
        }
      </video>
    );
  },
);

VideoPlayer.displayName = 'VideoPlayer';
