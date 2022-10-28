import { Asset, HttpError } from 'livepeer';
import { parseCid } from 'livepeer/media';

import * as React from 'react';

import { useAsset, useCreateAsset, usePlaybackInfo } from '../../hooks';
import { PlayerProps } from './Player';

export type UsePlaybackInfoOrImportProps = {
  src: PlayerProps['src'];
  playbackId: PlayerProps['playbackId'];
  refetchPlaybackInfoInterval: number;
  autoImport: boolean;
  onAssetStatusChange: (status: Asset['status']) => void;
};

/**
 * Retrieves the playback info for a playback ID or source URL.
 * Automatically imports a source URL from IPFS if it is a valid CID.
 *
 * @param src Source URL for the media.
 * @param playbackId Playback ID of the media.
 */
export const usePlaybackInfoOrImport = ({
  src,
  playbackId,
  refetchPlaybackInfoInterval,
  autoImport,
  onAssetStatusChange,
}: UsePlaybackInfoOrImportProps) => {
  const { mutate: importAsset, data: importedAsset } = useCreateAsset();

  const { data: asset } = useAsset({
    assetId: importedAsset?.[0]?.id,
    refetchInterval: (asset) =>
      asset?.status?.phase !== 'ready' ? refetchPlaybackInfoInterval : false,
  });

  React.useEffect(() => {
    if (asset?.status) {
      onAssetStatusChange(asset.status);
    }
  }, [asset?.status, onAssetStatusChange]);

  // check if the src or playbackId are IPFS sources (does not handle src arrays)
  const ipfsSrcOrPlaybackId = React.useMemo(
    () =>
      playbackId
        ? parseCid(playbackId)
        : !Array.isArray(src)
        ? parseCid(src)
        : null,
    [playbackId, src],
  );

  const { data: playbackInfo, error: playbackInfoError } = usePlaybackInfo({
    // attempt to fetch if the source is IPFS, or a playback ID is provided
    playbackId: ipfsSrcOrPlaybackId?.cid ?? playbackId ?? undefined,
    refetchInterval: (info) => (info ? false : refetchPlaybackInfoInterval),
  });

  // trigger an import if the playback info had a 404 error and the asset is an IPFS source
  // also must be enabled
  React.useEffect(() => {
    if (
      autoImport &&
      !importedAsset &&
      ipfsSrcOrPlaybackId?.url &&
      ipfsSrcOrPlaybackId?.cid &&
      (playbackInfoError as HttpError)?.code === 404
    ) {
      importAsset({
        sources: [
          {
            name: ipfsSrcOrPlaybackId?.cid,
            url: ipfsSrcOrPlaybackId.url,
          },
        ],
      });
    }
  }, [
    autoImport,
    importedAsset,
    ipfsSrcOrPlaybackId,
    playbackInfoError,
    importAsset,
  ]);

  return playbackInfo;
};