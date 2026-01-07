/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequest } from '@nocobase/client';
import { buildQueryParams, createDebouncedSearch } from '../utils';

interface UseSelectorDataOptions {
  collectionField: any;
  collection: any;
  record: any;
  pageSize?: number;
  enabled?: boolean;
  initialPage?: number;
  searchFields?: string[];
}

export const useSelectorData = ({
  collectionField,
  collection,
  record,
  pageSize = 10,
  enabled = true,
  initialPage = 1,
  searchFields,
}: UseSelectorDataOptions) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(initialPage);

  const debouncedSetSearch = useMemo(
    () => createDebouncedSearch(setDebouncedSearch, () => setCurrentPage(initialPage)),
    [initialPage],
  );

  useEffect(() => {
    debouncedSetSearch(search);
  }, [search, debouncedSetSearch]);

  const queryParams = useMemo(() => {
    return buildQueryParams(collectionField, debouncedSearch, collection, record, currentPage, pageSize, searchFields);
  }, [collectionField, debouncedSearch, collection, record, currentPage, pageSize, searchFields]);

  const { data, loading, run } = useRequest(
    {
      resource: collectionField?.target,
      action: 'list',
      params: queryParams,
    },
    {
      manual: true,
      refreshDeps: [queryParams],
    },
  );

  useEffect(() => {
    if (enabled && collectionField?.target && queryParams) {
      run();
    }
  }, [enabled, collectionField?.target, queryParams, run]);

  const resetSearch = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setCurrentPage(initialPage);
  }, [initialPage]);

  const listData = data?.data || [];
  const total = data?.meta?.count || 0;

  return {
    search,
    setSearch,
    debouncedSearch,
    currentPage,
    setCurrentPage,
    listData,
    total,
    loading,
    resetSearch,
  };
};
