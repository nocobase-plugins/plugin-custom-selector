/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Modal, Input, List, Pagination, Spin, Button, Space } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { observer, Schema } from '@formily/react';
import { useRequest } from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { SelectorCommonProps, buildQueryParams, createDebouncedSearch } from './utils';
import { ValueRenderer, ItemRenderer } from './components';
import { useSelectedItems } from './hooks';
import { NAMESPACE } from './constant';

export const ModalSelector: React.FC<SelectorCommonProps> = observer(
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
    const [visible, setVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // Refs
    const inputRef = useRef<any>(null);

    // Selected items management
    const { selectedItems, toggleItemSelection, removeItem } = useSelectedItems(value, isMultiple, collectionField);

    // Debounced search handling
    const debouncedSetSearch = createDebouncedSearch(setDebouncedSearch, () => setCurrentPage(1));

    useEffect(() => {
      debouncedSetSearch(search);
    }, [search]);

    // Build query parameters
    const queryParams = useMemo(() => {
      return buildQueryParams(collectionField, debouncedSearch, collection, record, currentPage, pageSize);
    }, [collectionField, debouncedSearch, collection, record, currentPage, pageSize]);

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

    // Request data when modal is visible
    useEffect(() => {
      if (visible && collectionField?.target && queryParams) {
        run();
      }
    }, [visible, collectionField?.target, queryParams, run]);

    // Handle opening modal
    const handleOpen = useCallback(() => {
      setVisible(true);
    }, []);

    // Handle closing modal
    const handleClose = useCallback(() => {
      setVisible(false);
      setSearch('');
      setDebouncedSearch('');
      setCurrentPage(1);
    }, []);

    // Handle search input
    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    }, []);

    // Handle modal opening focus
    const handleAfterOpenChange = useCallback((open: boolean) => {
      if (open && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }, []);

    // Handle selection confirmation (for multiple selection)
    const handleConfirmSelection = useCallback(() => {
      onChange?.(selectedItems);
      handleClose();
    }, [selectedItems, onChange, handleClose]);

    // Handle item selection in modal
    const handleModalSelect = useCallback(
      (item: any) => {
        if (isMultiple) {
          // Multiple selection mode: toggle selection state
          toggleItemSelection(item);
        } else {
          // Single selection mode: select and close
          onChange?.(item);
          handleClose();
        }
      },
      [isMultiple, toggleItemSelection, onChange, handleClose],
    );

    // Handle tag deletion
    const handleTagDelete = useCallback(
      (item: any) => {
        removeItem(item, onChange);
      },
      [removeItem, onChange],
    );

    // Handle clear all
    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering modal open
        onChange?.(null);
      },
      [onChange],
    );

    // Get list data
    const listData = data?.data || [];
    const total = data?.meta?.count || 0;

    // Pagination configuration
    const paginationConfig = {
      current: currentPage,
      pageSize,
      total,
      showSizeChanger: false,
      showQuickJumper: false,
      showTotal: (total: number, range: [number, number]) =>
        t('{{start}}-{{end}} of {{total}} items', {
          start: range[0],
          end: range[1],
          total,
        }),
      onChange: (page: number) => {
        setCurrentPage(page);
      },
    };

    // Check if there is a value and it's not empty
    const hasValue = isMultiple ? Array.isArray(value) && value.length > 0 : value;

    return (
      <>
        {/* Modal mode: clickable div that opens modal */}
        <div
          onClick={handleOpen}
          style={{
            cursor: 'pointer',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '4px 11px',
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#fff',
            position: 'relative',
            flexWrap: 'wrap',
            gap: '4px',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px' }}>
            {/* Display selected item tags - both single and multiple selection modes */}
            {value && (
              <>
                {/* Multiple selection mode: display multiple tags with delete buttons */}
                {isMultiple && Array.isArray(value) && value.length > 0 && (
                  <>
                    {value.map((item: any) => (
                      <ValueRenderer
                        key={item.id || item[collectionField?.targetKey || 'id']}
                        item={item}
                        actualRenderValue={actualRenderValue}
                        collectionField={collectionField}
                        showDeleteButton={true}
                        onDelete={handleTagDelete}
                        maxWidth={120}
                      />
                    ))}
                  </>
                )}

                {/* Single selection mode: display single tag with delete button (if not required) */}
                {!isMultiple && value && !Array.isArray(value) && (
                  <ValueRenderer
                    item={value}
                    actualRenderValue={actualRenderValue}
                    collectionField={collectionField}
                    showDeleteButton={true}
                    onDelete={handleTagDelete}
                    maxWidth={200}
                  />
                )}
              </>
            )}

            {/* Placeholder when no value */}
            {!hasValue && <span style={{ color: '#bfbfbf' }}>{placeholder || t('Click to open custom selector')}</span>}
          </div>

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

        <Modal
          open={visible}
          onCancel={handleClose}
          afterOpenChange={handleAfterOpenChange}
          footer={
            isMultiple ? (
              <div style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={handleClose}>{t('Cancel')}</Button>
                  <Button type="primary" icon={<CheckOutlined />} onClick={handleConfirmSelection}>
                    {t('Confirm')} ({selectedItems.length})
                  </Button>
                </Space>
              </div>
            ) : null
          }
          width={800}
          title={`${t('Select')}${Schema.compile(collectionField?.uiSchema?.title || 'Association Data', { t })}${
            isMultiple ? ` (${t('Multiple Selection')})` : ''
          }`}
          destroyOnClose
          style={{
            height: '90vh',
            top: '5vh',
          }}
          styles={{
            body: {
              height: 'calc(90vh - 110px)',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <div style={{ marginBottom: 8, marginTop: 16, flexShrink: 0 }}>
            <Input
              ref={inputRef}
              value={search}
              onChange={handleSearch}
              placeholder={t('Please enter search keywords')}
              allowClear
              autoFocus
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Spin spinning={loading} style={{ flex: 1 }}>
              <List
                dataSource={listData}
                renderItem={(item) => (
                  <ItemRenderer
                    item={item}
                    actualRenderItem={actualRenderItem}
                    collectionField={collectionField}
                    selectedItems={selectedItems}
                    isMultiple={isMultiple}
                    onSelect={handleModalSelect}
                    showBorder={true}
                  />
                )}
                locale={{
                  emptyText: debouncedSearch
                    ? t('No search results')
                    : collectionField?.target
                      ? t('No data')
                      : t('Please configure association field'),
                }}
                style={{
                  maxHeight: 'calc(90vh - 200px)',
                  overflowY: 'auto',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                }}
              />
            </Spin>

            {total > 0 && (
              <Pagination {...paginationConfig} style={{ marginTop: 16, textAlign: 'center', flexShrink: 0 }} />
            )}
          </div>
        </Modal>
      </>
    );
  },
);

ModalSelector.displayName = 'ModalSelector';
