import { ControlsOptions } from '@livepeer/core';
import { AspectRatio, ThemeConfig } from '@livepeer/core/media';
import { isNumber } from '@livepeer/core/utils';

import * as React from 'react';

import { useSourceMimeTyped } from './useSourceMimeTyped';

export type PlayerObjectFit = 'cover' | 'contain';

export type InternalPlayerProps = {
  /** If the element is currently shown on the DOM/screen. Should not be exposed externally to users. */
  _isCurrentlyShown: boolean;
};

export type PlayerProps<TElement, TPoster> = {
  /** The source(s) of the media (**required** if `playbackId` is not provided) */
  src?: string | string[] | null | undefined;
  /** The playback ID for the media (**required** if `src` is not provided) */
  playbackId?: string | null | undefined;

  /** The title of the media */
  title?: string;
  /** Shows/hides the title at the top of the media */
  showTitle?: boolean;

  /** Whether the media will loop when finished. Defaults to false. */
  loop?: boolean;

  /**
   * The aspect ratio of the media. Defaults to 16to9 (16 / 9).
   * This significantly improves the cumulative layout shift and is required for the player.
   *
   * @see {@link https://web.dev/cls/}
   * */
  aspectRatio?: AspectRatio;
  /**
   * Poster image to show when the content is either loading (when autoplaying) or hasn't started yet (without autoplay).
   * It is highly recommended to also pass in a `title` attribute as well, for ARIA compatibility.
   */
  poster?: TPoster;
  /** Enables/disables the loading spinner */
  showLoadingSpinner?: boolean;
  /** Enables/disables the dStorage uploading indicator (text and progress percentage) */
  showUploadingIndicator?: boolean;

  /** Configuration for the event listeners */
  controls?: ControlsOptions;
  /**
   * Play media automatically when the content loads (if this is specified, you must also specify muted,
   * since this is required in browsers)
   */
  autoPlay?: boolean;
  /** Mute media by default */
  muted?: boolean;

  /**
   * When true, the media will be considered high priority and preload. Lazy loading is automatically disabled for media using `priority`.
   * You should use the priority property on any media detected as the Largest Contentful Paint (LCP) element. It may be appropriate to have multiple, as different content may be the LCP element for different viewport sizes.
   *
   * Should only be used when the media is visible above the fold. Defaults to false.
   */
  priority?: boolean;

  /** Theme configuration for the player */
  theme?: ThemeConfig;

  /** The object-fit property for the video element. Defaults to cover (contain is usually used in full-screen applications) */
  objectFit?: PlayerObjectFit;

  /** Custom controls passed in to override the default controls */
  children?: React.ReactNode;

  /** The refetch interval for the playback info hook (used with `playbackId` to query until there is a valid playback URL) */
  refetchPlaybackInfoInterval?: number;

  /**
   * If a decentralized identifier (an IPFS CID/URL) should automatically be uploaded as an Asset if playback info does not exist.
   * A custom gateway can also be specified, which is used to play back the asset directly from dStorage (only the domain needs to be passed, e.g. `https://ipfs.fleek.co`).
   *
   * Defaults to auto upload with fallback to play from dStorage until the asset is uploaded.
   */
  autoUrlUpload?:
    | boolean
    | { fallback: true; ipfsGateway?: string; arweaveGateway?: string };

  /** If a decentralized identifier (an IPFS CID/URL) should automatically be imported as an Asset if playback info does not exist. Defaults to true. */
  jwt?: string;

  /** Callback called when the metrics plugin cannot be initialized properly */
  onMetricsError?: (error: Error) => void;

  /** Callback ref passed to the underlying media element. Simple refs are not supported, due to the use of HLS.js under the hood. */
  mediaElementRef?: React.RefCallback<TElement | null | undefined>;
} & (
  | {
      src: string | string[] | null | undefined;
    }
  | { playbackId: string | null | undefined }
);

export const usePlayer = <TElement, TPoster>(
  {
    autoPlay,
    children,
    controls,
    muted,
    playbackId,

    src,
    theme,
    title,
    poster,
    loop,

    onMetricsError,
    jwt,

    refetchPlaybackInfoInterval = 5000,
    autoUrlUpload = true,

    showLoadingSpinner = true,
    showUploadingIndicator = true,
    showTitle = true,
    priority,
    aspectRatio = '16to9',
    objectFit = 'contain',
    mediaElementRef,
  }: PlayerProps<TElement, TPoster>,
  { _isCurrentlyShown }: InternalPlayerProps,
) => {
  const [mediaElement, setMediaElement] = React.useState<TElement | null>(null);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const { source, uploadStatus } = useSourceMimeTyped({
    src,
    playbackId,
    jwt,
    refetchPlaybackInfoInterval,
    autoUrlUpload,
  });

  // if the source is priority or currently shown on the screen, then load
  const shouldLoad = React.useMemo(() => {
    return priority || _isCurrentlyShown;
  }, [priority, _isCurrentlyShown]);

  React.useEffect(() => {
    if (shouldLoad) {
      setHasLoaded(true);
    }
  }, [shouldLoad]);

  const hidePosterOnPlayed = React.useMemo(
    () =>
      Array.isArray(source)
        ? source?.[0]?.type !== 'audio'
          ? true
          : undefined
        : undefined,
    [source],
  );

  const playerRef = React.useCallback(
    (element: TElement | null) => {
      if (element) {
        setMediaElement(element);
        mediaElementRef?.(element);
      }
    },
    [mediaElementRef],
  );

  const loadingText = React.useMemo(
    () =>
      showUploadingIndicator
        ? uploadStatus?.phase === 'processing' &&
          isNumber(uploadStatus?.progress)
          ? `Processing: ${(Number(uploadStatus?.progress) * 100).toFixed(0)}%`
          : uploadStatus?.phase === 'failed'
          ? 'Upload Failed'
          : null
        : null,
    [uploadStatus, showUploadingIndicator],
  );

  return {
    mediaElement,
    source: hasLoaded || shouldLoad ? source : null,
    uploadStatus,
    playerProps: {
      ref: playerRef,
      autoPlay,
      muted: autoPlay ? true : muted,
      poster: poster,
      loop: loop,
      objectFit: objectFit,
      options: controls,
    },
    controlsContainerProps: {
      hidePosterOnPlayed,
      showLoadingSpinner,
      loadingText,
      showUploadingIndicator,
    },
    props: {
      autoPlay,
      children,
      controls,
      playbackId,
      src,
      theme,
      title,
      poster,
      loop,
      onMetricsError,
      jwt,
      refetchPlaybackInfoInterval,
      autoUrlUpload,
      showTitle,
      aspectRatio,
      objectFit,
    },
  };
};
