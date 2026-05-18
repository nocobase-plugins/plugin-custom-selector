/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { debounce } from 'lodash';
import { useCallback, useMemo } from 'react';

// Common interfaces
export interface SelectorCommonProps {
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  actualRenderItem: string;
  actualRenderValue: string;
  collectionField: any;
  isRequired: boolean;
  isMultiple: boolean;
  collection: any;
  record: any;
  searchFields?: string[];
  dataScopeFilter?: any;
}

// Query parameters builder utility
export const buildQueryParams = (
  collectionField,
  search,
  collection,
  record,
  page = 1,
  pageSize = 10,
  searchFields,
  dataScopeFilter,
) => {
  if (!collectionField?.target) return null;

  const params: any = {
    page,
    pageSize,
  };
  
  console.debug('[CustomSelector] dataScopeFilter applied:', JSON.stringify(dataScopeFilter));

  // Always apply dataScopeFilter as the base filter if present
  let baseFilter = undefined;
  if (dataScopeFilter && typeof dataScopeFilter === 'object' && Object.keys(dataScopeFilter).length > 0) {
    baseFilter = dataScopeFilter;
    console.debug('[CustomSelector] dataScopeFilter applied:', JSON.stringify(dataScopeFilter));
  }

  // Search filter - support multiple fields
  let searchFilter = undefined;
  if (search && search.trim()) {
    const targetCollection = collection?.collectionManager?.getCollection(collectionField.target);
    if (targetCollection) {
      const allFields = targetCollection.getFields();
      const narrowedFields = Array.isArray(searchFields) && searchFields.length > 0
        ? allFields.filter(field => searchFields.includes(field.name))
        : allFields;
      const searchableFields = narrowedFields.filter(field => {
        if (!field || !field.name) return false;
        const excludedTypes = ['password', 'token'];
        const excludedInterfaces = ['password', 'token'];
        if (excludedTypes.includes(field.type) || excludedInterfaces.includes(field.interface)) return false;
        const sensitiveFieldNames = ['password', 'token', 'resetToken', 'accessToken', 'refreshToken', 'apiToken'];
        if (sensitiveFieldNames.some(name => field.name.toLowerCase().includes(name.toLowerCase()))) return false;
        const supportedTypes = [
          'string', 'text', 'email', 'phone', 'uid', 'nanoid', 'integer', 'bigInt', 'float', 'double', 'decimal',
        ];
        const supportedInterfaces = [
          'input', 'textarea', 'email', 'phone', 'integer', 'number', 'percent', 'currency', 'select', 'radioGroup', 'checkboxGroup',
        ];
        return supportedTypes.includes(field.type) || supportedInterfaces.includes(field.interface);
      });
      const searchConditions = searchableFields.map(field => {
        if (['integer', 'bigInt', 'float', 'double', 'decimal'].includes(field.type)) {
          const numericValue = parseFloat(search.trim());
          if (!isNaN(numericValue)) {
            return {
              $or: [{ [field.name]: { $includes: search.trim() } }, { [field.name]: { $eq: numericValue } }],
            };
          }
        }
        return { [field.name]: { $includes: search.trim() } };
      });
      searchFilter = { $or: searchConditions };
      console.debug('[CustomSelector] searchFilter applied:', JSON.stringify(searchFilter));
    } else {
      const labelField = collectionField.targetKey || 'name' || 'title' || 'label';
      searchFilter = { [labelField]: { $includes: search.trim() } };
      console.debug('[CustomSelector] fallback searchFilter applied:', JSON.stringify(searchFilter));
    }
  }

  // Combine baseFilter and searchFilter
  if (baseFilter && searchFilter) {
    params.filter = { $and: [baseFilter, searchFilter] };
    console.debug('[CustomSelector] Combined filter:', JSON.stringify(params.filter));
  } else if (baseFilter) {
    params.filter = baseFilter;
    console.debug('[CustomSelector] Only dataScopeFilter used:', JSON.stringify(params.filter));
  } else if (searchFilter) {
    params.filter = searchFilter;
    console.debug('[CustomSelector] Only searchFilter used:', JSON.stringify(params.filter));
  }

  // Association field filter
  if (collectionField.foreignKey && record?.data) {
    const sourceValue = record.data[collectionField.sourceKey];
    if (sourceValue !== undefined && sourceValue !== null) {
      if (["oho", "o2m"].includes(collectionField.interface)) {
        if (params.filter) {
          params.filter = {
            $and: [params.filter, {
              $or: [
                { [collectionField.foreignKey]: { $is: null } },
                { [collectionField.foreignKey]: { $eq: sourceValue } },
              ],
            }],
          };
          console.debug('[CustomSelector] Association filter appended:', JSON.stringify(params.filter));
        } else {
          params.filter = {
            $or: [
              { [collectionField.foreignKey]: { $is: null } },
              { [collectionField.foreignKey]: { $eq: sourceValue } },
            ],
          };
          console.debug('[CustomSelector] Only association filter used:', JSON.stringify(params.filter));
        }
      }
    }
  }
  console.debug('[CustomSelector] Final query params:', JSON.stringify(params));
  return params;
};

// Safe render function execution utility
export const executeRenderFunction = (renderFunction: string, item: any, fallbackExtractor?: (item: any) => string) => {
  try {
    const func = eval(`(${renderFunction})`);
    return func(item);
  } catch (error) {
    console.error('Render function execution error:', error);
    if (fallbackExtractor) {
      return fallbackExtractor(item);
    }
    // Default fallback
    const fallbackText = item?.name || item?.title || item?.label || item?.id || 'Unknown';
    return String(fallbackText);
  }
};

// Get item key for comparison
export const getItemKey = (item: any, collectionField: any) => {
  return item?.id || item?.[collectionField?.targetKey || 'id'];
};

// Check if item is selected
export const isItemSelected = (item: any, selectedItems: any[], collectionField: any): boolean => {
  const itemKey = getItemKey(item, collectionField);
  return selectedItems.some((selected) => getItemKey(selected, collectionField) === itemKey);
};

// Create debounced search handler
export const createDebouncedSearch = (setDebouncedSearch: (value: string) => void, resetPage?: () => void) => {
  return debounce((value: string) => {
    setDebouncedSearch(value);
    resetPage?.();
  }, 300);
};

// Get fallback text for item
export const getItemFallbackText = (item: any): string => {
  return item?.name || item?.nickname || item?.username || item?.title || item?.label || item?.id || 'Unknown';
};
