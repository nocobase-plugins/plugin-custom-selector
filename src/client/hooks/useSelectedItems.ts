/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useState, useEffect, useCallback } from 'react';
import { getItemKey } from '../utils';

export const useSelectedItems = (value: any, isMultiple: boolean, collectionField: any) => {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Initialize selected items - only update when value changes
  useEffect(() => {
    if (isMultiple && Array.isArray(value)) {
      setSelectedItems([...value]); // Create copy
    } else if (!isMultiple && value) {
      setSelectedItems([value]);
    } else {
      setSelectedItems([]);
    }
  }, [value, isMultiple]);

  // Toggle item selection
  const toggleItemSelection = useCallback(
    (item: any, onChange?: (value: any) => void) => {
      if (isMultiple) {
        // Multiple selection mode: toggle selection state
        const itemKey = getItemKey(item, collectionField);

        setSelectedItems((prev) => {
          const isSelected = prev.some((selected) => getItemKey(selected, collectionField) === itemKey);

          if (isSelected) {
            // Unselect
            const newItems = prev.filter((selected) => getItemKey(selected, collectionField) !== itemKey);
            onChange?.(newItems);
            return newItems;
          } else {
            // Add selection
            const exists = prev.some((selected) => getItemKey(selected, collectionField) === itemKey);
            if (!exists) {
              const newItems = [...prev, item];
              onChange?.(newItems);
              return newItems;
            }
            return prev;
          }
        });
      } else {
        // Single selection mode: select directly
        onChange?.(item);
      }
    },
    [isMultiple, collectionField],
  );

  // Remove single item (for tags)
  const removeItem = useCallback(
    (item: any, onChange?: (value: any) => void) => {
      if (isMultiple) {
        const itemKey = getItemKey(item, collectionField);
        const newValue = Array.isArray(value)
          ? value.filter((selectedItem: any) => getItemKey(selectedItem, collectionField) !== itemKey)
          : [];
        onChange?.(newValue);
      } else {
        onChange?.(null);
      }
    },
    [isMultiple, value, collectionField],
  );

  // Remove last item (for backspace handling)
  const removeLastItem = useCallback(
    (onChange?: (value: any) => void) => {
      if (isMultiple && Array.isArray(value) && value.length > 0) {
        const newValue = value.slice(0, -1);
        onChange?.(newValue);
      } else if (!isMultiple && value) {
        onChange?.(null);
      }
    },
    [isMultiple, value],
  );

  return {
    selectedItems,
    toggleItemSelection,
    removeItem,
    removeLastItem,
  };
};
