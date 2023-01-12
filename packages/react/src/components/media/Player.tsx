import {
  PlayerProps as CorePlayerProps,
  PlayerObjectFit,
  usePlayer,
} from '@livepeer/core-react/components';
import { AudioSrc, VideoSrc } from 'livepeer/media';
import { ControlsOptions } from 'livepeer/media/browser';

import * as React from 'react';

import { MediaControllerProvider } from '../../context';
import { useIsElementShown } from '../useIsElementShown';

import {
  AirPlayButton,
  Container,
  ControlsContainer,
  FullscreenButton,
  PictureInPictureButton,
  PlayButton,
  Poster,
  Progress,
  TimeDisplay,
  Title,
  Volume,
} from './controls';
import { AudioPlayer, HlsPlayer, VideoPlayer } from './players';

export type PosterSource = string | React.ReactNode;

type PlayerProps = CorePlayerProps<HTMLMediaElement, PosterSource> & {
  /** Whether to show the picture in picture button (web only) */
  showPipButton?: boolean;

  /** Whether to show the airplay button (Safari only) */
  showAirplayButton?: boolean;

  /** Configuration for the event listeners */
  controls?: ControlsOptions;
};

export type { PlayerObjectFit, PlayerProps };

export const PlayerInternal = (props: PlayerProps) => {
  const [isCurrentlyShown, setIsCurrentlyShown] = React.useState(false);

  const {
    mediaElement,
    playerProps,
    controlsContainerProps,
    source,
    props: {
      children,
      controls,
      theme,
      title,
      poster,
      onStreamStatusChange,
      onMetricsError,
      onAccessControlError,
      showTitle,
      aspectRatio,
    },
  } = usePlayer<HTMLMediaElement, PosterSource>(props, {
    _isCurrentlyShown: isCurrentlyShown,
  });

  const _isCurrentlyShown = useIsElementShown(mediaElement);

  React.useEffect(() => {
    setIsCurrentlyShown(_isCurrentlyShown);
  }, [_isCurrentlyShown]);

  return (
    <MediaControllerProvider element={mediaElement} opts={controls ?? {}}>
      <Container theme={theme} aspectRatio={aspectRatio}>
        {source && !Array.isArray(source) ? (
          <HlsPlayer
            {...playerProps}
            src={source}
            onStreamStatusChange={onStreamStatusChange}
            onMetricsError={onMetricsError}
            onAccessControlError={onAccessControlError}
          />
        ) : source?.[0]?.type === 'audio' ? (
          <AudioPlayer
            {...playerProps}
            src={source as AudioSrc[]}
            // onStreamStatusChange={onStreamStatusChange} // TODO: Add stream status change handling for audio
            // onAccessControlError={onAccessControlError} // TODO: Add access control error handling for audio
          />
        ) : (
          <VideoPlayer
            {...playerProps}
            src={source as VideoSrc[] | null}
            onStreamStatusChange={onStreamStatusChange}
            onAccessControlError={onAccessControlError}
          />
        )}

        {React.isValidElement(children) ? (
          children
        ) : (
          <>
            <ControlsContainer
              {...controlsContainerProps}
              poster={poster && <Poster content={poster} title={title} />}
              top={<>{title && showTitle && <Title content={title} />}</>}
              middle={<Progress />}
              left={
                <>
                  <PlayButton />
                  <Volume />
                  <TimeDisplay />
                </>
              }
              right={
                <>
                  {props.showPipButton && <PictureInPictureButton />}
                  {props.showAirplayButton && <AirPlayButton />}
                  <FullscreenButton />
                </>
              }
            />
          </>
        )}
      </Container>
    </MediaControllerProvider>
  );
};

export const Player = React.memo(PlayerInternal);
