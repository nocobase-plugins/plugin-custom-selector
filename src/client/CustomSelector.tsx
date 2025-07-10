/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { observer, useField, useFieldSchema } from '@formily/react';
import { useCollection, useCollectionRecord } from '@nocobase/client';
import { ModalSelector } from './ModalSelector';
import { DropdownSelector } from './DropdownSelector';
import { SelectorCommonProps } from './utils';

interface CustomSelectorProps {
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  renderItem?: string;
  renderValue?: string;
}

export const CustomSelector: React.FC<CustomSelectorProps> = observer(
  ({ value, onChange, placeholder, renderItem, renderValue }) => {
    // Hooks
    const field = useField();
    const fieldSchema = useFieldSchema();
    const collection = useCollection();
    const record = useCollectionRecord();

    // Get render functions from schema or use defaults
    const actualRenderItem = useMemo(() => {
      return fieldSchema['x-component-props']?.renderItem || field?.componentProps?.renderItem || renderItem;
    }, [fieldSchema, field, renderItem]);

    const actualRenderValue = useMemo(() => {
      return fieldSchema['x-component-props']?.renderValue || field?.componentProps?.renderValue || renderValue;
    }, [fieldSchema, field, renderValue]);

    // Get selector mode from schema or field props
    const customSelectorMode = useMemo(() => {
      return (
        fieldSchema['x-component-props']?.customSelectorMode || field?.componentProps?.customSelectorMode !== false
      );
    }, [fieldSchema, field]);

    // Get allow multiple from schema or field props
    const customAllowMultiple = useMemo(() => {
      return (
        (fieldSchema['x-component-props']?.allowMultiple || field?.componentProps?.allowMultiple) ??
        (fieldSchema?.['x-component-props']?.multiple || field?.componentProps?.multiple || false)
      );
    }, [fieldSchema, field]);

    // Get association field information
    const collectionField = useMemo(() => {
      if (!collection || !fieldSchema) return null;
      return collection.getField(fieldSchema['name']) || collection.getField(fieldSchema['x-collection-field']);
    }, [collection, fieldSchema]);

    // Check if field is required
    const isRequired = useMemo(() => {
      // Check field schema required property
      if (fieldSchema?.required) return true;

      // Check field required property
      if (field?.['required']) return true;

      return false;
    }, [fieldSchema, field]);

    // Error check
    if (!collectionField?.target) {
      console.warn('CustomSelector: No associated field configuration or target table', {
        fieldSchema: fieldSchema?.name,
        collectionField,
      });
    }

    // Common props for both selectors
    const commonProps: SelectorCommonProps = {
      value,
      onChange,
      placeholder,
      actualRenderItem,
      actualRenderValue,
      collectionField,
      isRequired,
      isMultiple: customAllowMultiple,
      collection,
      record,
    };

    // Render appropriate selector based on mode
    if (customSelectorMode === 'modal') {
      return <ModalSelector {...commonProps} />;
    } else {
      return <DropdownSelector {...commonProps} />;
    }
  },
);

CustomSelector.displayName = 'CustomSelector';
