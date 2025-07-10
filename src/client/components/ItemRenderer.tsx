/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { List, Checkbox } from 'antd';
import { useTranslation } from 'react-i18next';
import { executeRenderFunction, getItemKey, isItemSelected } from '../utils';
import { NAMESPACE } from '../constant';

interface ItemRendererProps {
  item: any;
  actualRenderItem: string;
  collectionField: any;
  selectedItems: any[];
  isMultiple: boolean;
  onSelect: (item: any) => void;
  showBorder?: boolean;
}

export const ItemRenderer: React.FC<ItemRendererProps> = ({
  item,
  actualRenderItem,
  collectionField,
  selectedItems,
  isMultiple,
  onSelect,
  showBorder = true,
}) => {
  const { t } = useTranslation(NAMESPACE);
  const itemKey = getItemKey(item, collectionField);
  const isSelected = isItemSelected(item, selectedItems, collectionField);

  try {
    const htmlString = executeRenderFunction(actualRenderItem, item);

    return (
      <List.Item
        key={itemKey}
        onClick={() => onSelect(item)}
        style={{
          cursor: 'pointer',
          padding: '8px 12px',
          borderBottom: showBorder ? '1px solid #f0f0f0' : 'none',
          backgroundColor: isSelected && isMultiple ? '#e6f7ff' : 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isSelected && isMultiple ? '#e6f7ff' : '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isSelected && isMultiple ? '#e6f7ff' : 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {isMultiple && (
            <Checkbox
              checked={isSelected}
              style={{ marginRight: 8 }}
              onChange={(e) => {
                e.stopPropagation();
                onSelect(item);
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          )}
          <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: htmlString }} />
        </div>
      </List.Item>
    );
  } catch (error) {
    console.error('List item rendering error:', error);
    const fallbackText = item?.name || item?.title || item?.label || item?.id || '';

    return (
      <List.Item
        key={itemKey}
        onClick={() => onSelect(item)}
        style={{
          cursor: 'pointer',
          padding: '8px 12px',
          borderBottom: showBorder ? '1px solid #f0f0f0' : 'none',
        }}
      >
        {t('Rendering error')}: {String(fallbackText)}
      </List.Item>
    );
  }
};
