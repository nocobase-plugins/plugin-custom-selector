/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { List, Spin } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { useRequest } from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { SelectorCommonProps, buildQueryParams, createDebouncedSearch } from './utils';
import { ValueRenderer, ItemRenderer } from './components';
import { useSelectedItems } from './hooks';
import { NAMESPACE } from './constant';

export const DropdownSelector: React.FC<SelectorCommonProps> = observer(
  ({
    value,
    onChange,
    placeholder,
    actualRenderItem,
    actualRenderValue,
    collectionField,
    isRequired,
    isMultiple,
    collection,
    record,
  }) => {
    const { t } = useTranslation(NAMESPACE);

    // State management
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number }>({
      top: 0,
      left: 0,
      width: 0,
    });

    // Refs
    const inputRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Selected items management
    const { selectedItems, toggleItemSelection, removeItem, removeLastItem } = useSelectedItems(
      value,
      isMultiple,
      collectionField,
    );

    // Debounced search handling
    const debouncedSetSearch = createDebouncedSearch(setDebouncedSearch);

    useEffect(() => {
      debouncedSetSearch(search);
    }, [search, debouncedSetSearch]);

    // Build query parameters
    const queryParams = useMemo(() => {
      return buildQueryParams(collectionField, debouncedSearch, collection, record, 1, 10);
    }, [collectionField, debouncedSearch, collection, record]);

    // Data query
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

    // Request data when dropdown is visible
    useEffect(() => {
      if (dropdownVisible && collectionField?.target && queryParams) {
        run();
      }
    }, [dropdownVisible, collectionField?.target, queryParams, run]);

    // Search input handler
    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearch(value);
    }, []);

    // Keyboard event handler for backspace deletion
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        // When input is empty and backspace is pressed, delete the last selected item
        if (e.key === 'Backspace' && search.trim() === '') {
          e.preventDefault(); // Prevent default deletion behavior
          removeLastItem(onChange);
        }
      },
      [search, removeLastItem, onChange],
    );

    // Update dropdown position
    const updateDropdownPosition = useCallback(() => {
      if (containerRef.current && dropdownVisible) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }, [dropdownVisible]);

    // Handle focus to show dropdown
    const handleFocus = useCallback(() => {
      setDropdownVisible(true);

      // Calculate dropdown position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }, []);

    // Update dropdown position when value changes (container height may change)
    useEffect(() => {
      if (dropdownVisible) {
        // Use setTimeout to ensure DOM update is completed before calculating position
        setTimeout(updateDropdownPosition, 0);
      }
    }, [value, updateDropdownPosition, dropdownVisible]);

    // Clear search content when dropdown is hidden
    useEffect(() => {
      if (!dropdownVisible) {
        setSearch('');
        setDebouncedSearch('');
      }
    }, [dropdownVisible]);

    // Listen for window resize and scroll events to recalculate dropdown position
    useEffect(() => {
      if (!dropdownVisible) return;

      const handleResize = () => {
        updateDropdownPosition();
      };

      const handleScroll = () => {
        updateDropdownPosition();
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }, [dropdownVisible, updateDropdownPosition]);

    // Handle blur to hide dropdown - only effective in single selection mode
    const handleBlur = useCallback(() => {
      if (!isMultiple) {
        // Single selection mode: delay hiding to allow clicking dropdown items
        setTimeout(() => setDropdownVisible(false), 200);
      }
      // Multiple selection mode: don't hide on blur, handled by clicking outside
    }, [isMultiple]);

    // Handle clicking outside to hide dropdown (only used in multiple selection mode)
    useEffect(() => {
      if (!isMultiple || !dropdownVisible) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;

        // Check if click is inside container or dropdown
        if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
          return; // Click is inside, don't hide
        }

        // Click is outside, hide dropdown
        setDropdownVisible(false);
      };

      // Add event listener
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isMultiple, dropdownVisible]);

    // Handle dropdown item selection
    const handleDropdownSelect = useCallback(
      (item: any) => {
        toggleItemSelection(item, onChange);

        if (!isMultiple) {
          // Single selection mode: close dropdown and clear search
          setDropdownVisible(false);
          setSearch('');
          setDebouncedSearch('');
        }
      },
      [isMultiple, toggleItemSelection, onChange],
    );

    // Handle clear all
    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event bubbling
        onChange?.(null); // Only used in single selection mode, so set to null
      },
      [onChange],
    );

    // Get list data
    const listData = data?.data || [];

    // Check if there is a value and it's not empty
    const hasValue = isMultiple
      ? Array.isArray(value) && value.length > 0
      : value !== null && value !== undefined && value !== '';

    return (
      <div style={{ position: 'relative' }}>
        {/* Custom input container with tags and input */}
        <div
          ref={containerRef}
          style={{
            minHeight: '32px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            backgroundColor: '#fff',
            padding: '4px 8px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '4px',
            cursor: 'text',
          }}
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }}
        >
          {/* Display selected item tags - both single and multiple selection modes */}
          {value && (
            <>
              {/* Multiple selection mode: display multiple tags */}
              {isMultiple && Array.isArray(value) && value.length > 0 && (
                <>
                  {value.map((item: any) => (
                    <ValueRenderer
                      key={item.id || item[collectionField?.targetKey || 'id']}
                      item={item}
                      actualRenderValue={actualRenderValue}
                      collectionField={collectionField}
                      showDeleteButton={true}
                      onDelete={(deletedItem) => removeItem(deletedItem, onChange)}
                      maxWidth={120}
                    />
                  ))}
                </>
              )}

              {/* Single selection mode: display single tag (no delete button) */}
              {!isMultiple && value && !Array.isArray(value) && (
                <ValueRenderer
                  item={value}
                  actualRenderValue={actualRenderValue}
                  collectionField={collectionField}
                  showDeleteButton={true}
                  onDelete={(deletedItem) => removeItem(deletedItem, onChange)}
                  maxWidth={200}
                />
              )}
            </>
          )}

          {/* Input field */}
          <input
            ref={inputRef}
            value={search}
            onChange={handleSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={
              // New logic:
              // 1. When no value: always show placeholder
              // 2. When has value: show placeholder when dropdown is visible
              !hasValue
                ? placeholder || t('Please enter search keywords')
                : dropdownVisible
                  ? placeholder || t('Please enter search keywords')
                  : ''
            }
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              flex: 1,
              minWidth: '100px',
              fontSize: '14px',
              lineHeight: '22px',
            }}
          />

          {/* Clear button */}
          {isMultiple && hasValue && (
            <button
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: '#bfbfbf',
                cursor: 'pointer',
                padding: '0',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ff4d4f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#bfbfbf';
              }}
              title={t('Clear all')}
            >
              <CloseOutlined style={{ fontSize: '12px' }} />
            </button>
          )}
        </div>

        {/* Use Portal to render dropdown to body */}
        {dropdownVisible &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{
                position: 'absolute',
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                backgroundColor: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                zIndex: 9999,
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Spin spinning={loading}>
                {listData.length > 0 ? (
                  <List
                    dataSource={listData}
                    renderItem={(item) => (
                      <ItemRenderer
                        item={item}
                        actualRenderItem={actualRenderItem}
                        collectionField={collectionField}
                        selectedItems={selectedItems}
                        isMultiple={isMultiple}
                        onSelect={handleDropdownSelect}
                        showBorder={true}
                      />
                    )}
                    style={{
                      maxHeight: '250px',
                      overflowY: 'auto',
                    }}
                  />
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
                    {search.trim() ? t('No search results') : t('No data')}
                  </div>
                )}
              </Spin>
            </div>,
            document.body,
          )}
      </div>
    );
  },
);

DropdownSelector.displayName = 'DropdownSelector';
