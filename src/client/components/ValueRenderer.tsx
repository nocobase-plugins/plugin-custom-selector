/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { executeRenderFunction, getItemKey, getItemFallbackText } from '../utils';
import { NAMESPACE } from '../constant';

interface ValueRendererProps {
  item: any;
  actualRenderValue: string;
  collectionField: any;
  showDeleteButton?: boolean;
  onDelete?: (item: any) => void;
  maxWidth?: number;
}

export const ValueRenderer: React.FC<ValueRendererProps> = ({
  item,
  actualRenderValue,
  collectionField,
  showDeleteButton = false,
  onDelete,
  maxWidth = 120,
}) => {
  const { t } = useTranslation(NAMESPACE);
  const itemKey = getItemKey(item, collectionField);

  try {
    const itemHtml = executeRenderFunction(actualRenderValue, item);

    return (
      <div
        key={itemKey}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 6px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          fontSize: '12px',
          maxWidth: `${maxWidth}px`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          dangerouslySetInnerHTML={{ __html: itemHtml }}
        />
        {showDeleteButton && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            style={{
              marginLeft: '4px',
              background: 'none',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              padding: '0',
              width: '14px',
              height: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '2px',
              fontSize: '12px',
              lineHeight: '1',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ff4d4f';
              e.currentTarget.style.backgroundColor = '#fff2f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#999';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title={t('Delete')}
          >
            ×
          </button>
        )}
      </div>
    );
  } catch (error) {
    console.error('Tag rendering error:', error);
    const fallbackText = getItemFallbackText(item);

    return (
      <div
        key={itemKey}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 6px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          fontSize: '12px',
          flexShrink: 0,
        }}
      >
        <span>{fallbackText}</span>
        {showDeleteButton && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            style={{
              marginLeft: '4px',
              background: 'none',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              padding: '0',
              width: '14px',
              height: '14px',
            }}
            title={t('Delete')}
          >
            ×
          </button>
        )}
      </div>
    );
  }
};
