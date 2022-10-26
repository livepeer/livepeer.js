import { createAsset } from 'livepeer/actions';
import { UploadProgress } from 'livepeer/src/types/provider';
import { Asset, CreateAssetArgs, LivepeerProvider } from 'livepeer/types';
import { pick } from 'livepeer/utils';
import { useState } from 'react';

import { QueryClientContext } from '../../context';
import {
  UsePickMutationOptions,
  useInternalMutation,
  usePickMutationKeys,
} from '../../utils';
import { useLivepeerProvider } from '../providers';

export function useCreateAsset<TLivepeerProvider extends LivepeerProvider>(
  options?: Partial<
    UsePickMutationOptions<
      Asset[],
      Error,
      Omit<CreateAssetArgs, 'onUploadProgress'>
    >
  >,
) {
  const livepeerProvider = useLivepeerProvider<TLivepeerProvider>();

  const [uploadProgress, setUploadProgress] = useState<
    UploadProgress | undefined
  >(undefined);

  const internalQuery = useInternalMutation(
    async (args: CreateAssetArgs) =>
      createAsset<TLivepeerProvider>({
        files: args.files,
        onUploadProgress: (progress) => setUploadProgress(progress),
      }),
    {
      context: QueryClientContext,
      mutationKey: [{ entity: 'createAsset', livepeerProvider }],
      ...(typeof options === 'object'
        ? pick(options, usePickMutationKeys)
        : {}),
    },
  );

  return {
    ...internalQuery,
    uploadProgress,
  } as const;
}
