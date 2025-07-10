/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import {
  useCollection,
  useDesignable,
  SchemaSettingsItem,
  useIsFieldReadPretty,
  useCollectionField,
} from '@nocobase/client';
import { Tabs, Input, Form, Modal, Button, message, Radio, Switch } from 'antd';
import _ from 'lodash';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Schema } from '@formily/react';
import { NAMESPACE } from './constant';

const { TextArea } = Input;

// Custom component to display available fields
const FieldsInfoDisplay = ({ fields, t, parameterName = 'item' }) => {
  const handleCopyField = (fieldPath) => {
    navigator.clipboard
      .writeText(fieldPath)
      .then(() => {
        message.success(t('Copied!'));
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = fieldPath;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        message.success(t('Copied!'));
      });
  };

  const fieldElements = useMemo(() => {
    if (!fields || fields.length === 0) {
      return <span>{t('No fields available')}</span>;
    }

    return fields.map((field, index) => {
      const fieldPath = `${parameterName}.${field.name}`;

      return (
        <span key={field.name}>
          <span
            onClick={() => handleCopyField(fieldPath)}
            style={{
              color: '#1890ff',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '12px',
              backgroundColor: '#f0f8ff',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #d6e4ff',
              display: 'inline-block',
              transition: 'all 0.2s ease',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.backgroundColor = '#e6f7ff';
              target.style.borderColor = '#91d5ff';
              target.style.transform = 'translateY(-1px)';
              target.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement;
              target.style.backgroundColor = '#f0f8ff';
              target.style.borderColor = '#d6e4ff';
              target.style.transform = 'translateY(0)';
              target.style.boxShadow = 'none';
            }}
            title={t('Click to copy')}
          >
            {fieldPath}
          </span>
          {field.title && field.title !== field.name && (
            <span
              style={{
                color: '#999',
                fontSize: '12px',
                marginLeft: '4px',
                fontStyle: 'italic',
              }}
            >
              ({field.title})
            </span>
          )}
          {index < fields.length - 1 && (
            <span
              style={{
                margin: '0 8px',
                color: '#d9d9d9',
                fontSize: '12px',
              }}
            >
              •
            </span>
          )}
        </span>
      );
    });
  }, [fields, t, parameterName]);

  return (
    <div
      style={{
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#f6f6f6',
        border: '1px solid #d9d9d9',
        borderLeft: '4px solid #1890ff',
        borderRadius: '4px',
        fontSize: '13px',
        lineHeight: '1.8',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#1890ff',
          fontSize: '14px',
        }}
      >
        💡 {t('Available Fields Hint')}
      </div>
      <div style={{ color: '#666', lineHeight: '1.8' }}>
        <div style={{ marginBottom: '4px' }}>{t('Fields can be used in functions as')}:</div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
            lineHeight: '2',
          }}
        >
          {fieldElements}
        </div>
      </div>
    </div>
  );
};

// Configuration Modal Component with Tabs
const CustomSelectorConfigModal = ({
  visible,
  onCancel,
  onOk,
  field,
  fieldSchema,
  availableFields,
  t,
  dynamicDefaultRenderItem,
  dynamicDefaultRenderValue,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic'); // Default to basic configuration tab

  // Initialize form values when modal opens
  React.useEffect(() => {
    if (visible) {
      const initialValues = {
        allowMultiple:
          fieldSchema['x-component-props']?.allowMultiple ??
          (fieldSchema?.['x-component-props']?.multiple || field?.componentProps?.multiple || false),
        selectorMode: fieldSchema['x-component-props']?.customSelectorMode || 'dropdown', // Default to dropdown mode
        renderItem: fieldSchema['x-component-props']?.renderItem || dynamicDefaultRenderItem,
        renderValue: fieldSchema['x-component-props']?.renderValue || dynamicDefaultRenderValue,
      };
      form.setFieldsValue(initialValues);
    }
  }, [visible, fieldSchema, dynamicDefaultRenderItem, dynamicDefaultRenderValue, form]);

  const useShowMultipleSwitch = () => {
    const isFieldReadPretty = useIsFieldReadPretty();
    const collectionField = useCollectionField();
    return !isFieldReadPretty && ['hasMany', 'belongsToMany', 'belongsToArray'].includes(collectionField?.type);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // Get current form values, including empty strings
      const currentValues = form.getFieldsValue();

      // For each field, use the current form value, or default if undefined/null
      // Empty string means user intentionally cleared it, should use default
      const completeValues = {
        allowMultiple: currentValues.allowMultiple,
        customSelectorMode: currentValues.selectorMode,
        renderItem:
          currentValues.renderItem !== undefined
            ? currentValues.renderItem.trim() || dynamicDefaultRenderItem
            : fieldSchema['x-component-props']?.renderItem || dynamicDefaultRenderItem,
        renderValue:
          currentValues.renderValue !== undefined
            ? currentValues.renderValue.trim() || dynamicDefaultRenderValue
            : fieldSchema['x-component-props']?.renderValue || dynamicDefaultRenderValue,
      };
      onOk(completeValues);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={t('Configure Custom Selector')}
      open={visible}
      onCancel={onCancel}
      width="80%"
      style={{ minHeight: '600px' }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('Cancel')}
        </Button>,
        <Button key="ok" type="primary" onClick={handleOk}>
          {t('Save')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ minHeight: '500px' }}
          items={[
            {
              key: 'basic',
              label: t('Basic Configuration'),
              children: (
                <div style={{ minHeight: '460px' }}>
                  {useShowMultipleSwitch && (
                    <Form.Item name="allowMultiple" label={t('Allow multiple')} style={{ marginBottom: '8px' }}>
                      <Switch size="small" />
                    </Form.Item>
                  )}
                  <Form.Item name="selectorMode" label={t('Selector Mode')} style={{ marginBottom: '8px' }}>
                    <Radio.Group>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Radio value="dropdown" style={{ fontSize: '14px', alignItems: 'flex-start' }}>
                          <div style={{ marginLeft: '8px', lineHeight: '1.4' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{t('Dropdown Mode')}</div>
                            <div style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
                              {t(
                                'Uses a dropdown menu for selection, suitable for scenarios with fewer options and simple display',
                              )}
                            </div>
                          </div>
                        </Radio>
                        <Radio value="modal" style={{ fontSize: '14px', alignItems: 'flex-start' }}>
                          <div style={{ marginLeft: '8px', lineHeight: '1.4' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{t('Modal Mode')}</div>
                            <div style={{ color: '#666', fontSize: '12px', lineHeight: '1.5' }}>
                              {t(
                                'Opens a popup window for selection, suitable for scenarios with many options or complex display requirements',
                              )}
                            </div>
                          </div>
                        </Radio>
                      </div>
                    </Radio.Group>
                  </Form.Item>

                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#f6f8fa',
                      border: '1px solid #e1e4e8',
                      borderRadius: '6px',
                      borderLeft: '4px solid #1890ff',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 'bold',
                        marginBottom: '8px',
                        color: '#1890ff',
                        fontSize: '14px',
                      }}
                    >
                      💡 {t('Configuration Description')}
                    </div>
                    <div style={{ color: '#666', lineHeight: '1.6', fontSize: '13px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>{t('Dropdown Mode')}:</strong>{' '}
                        {t('Compact display, quick selection, suitable for simple scenarios')}
                      </div>
                      <div>
                        <strong>{t('Modal Mode')}:</strong>{' '}
                        {t('Rich display, supports search and pagination, suitable for complex scenarios')}
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'renderItem',
              label: t('List Item Render Configuration'),
              children: (
                <div style={{ minHeight: '460px' }}>
                  <Form.Item name="renderItem" label={t('List Item Render Function')} style={{ marginBottom: '0' }}>
                    <TextArea
                      rows={12}
                      style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      placeholder={dynamicDefaultRenderItem}
                    />
                  </Form.Item>
                  <div
                    style={{
                      padding: '8px 0',
                      borderTop: '1px solid #f0f0f0',
                    }}
                  >
                    <div
                      style={{
                        color: '#666',
                        fontSize: '13px',
                        lineHeight: '1.5',
                      }}
                    >
                      💡{' '}
                      {t(
                        "This function is used to render each item in the selection list. The parameter 'item' is the data object for each item.",
                      )}
                    </div>
                  </div>
                  <FieldsInfoDisplay fields={availableFields} t={t} parameterName="item" />
                </div>
              ),
            },
            {
              key: 'renderValue',
              label: t('Selected Value Render Configuration'),
              children: (
                <div style={{ minHeight: '460px' }}>
                  <Form.Item
                    name="renderValue"
                    label={t('Selected Value Render Function')}
                    style={{ marginBottom: '0' }}
                  >
                    <TextArea
                      rows={12}
                      style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      placeholder={dynamicDefaultRenderValue}
                    />
                  </Form.Item>
                  <div
                    style={{
                      padding: '8px 0',
                      borderTop: '1px solid #f0f0f0',
                    }}
                  >
                    <div
                      style={{
                        color: '#666',
                        fontSize: '13px',
                        lineHeight: '1.5',
                      }}
                    >
                      💡{' '}
                      {t(
                        "This function is used to render the selected value display. The parameter 'value' is the selected data object.",
                      )}
                    </div>
                  </div>
                  <FieldsInfoDisplay fields={availableFields} t={t} parameterName="value" />
                </div>
              ),
            },
          ]}
        />
      </Form>
    </Modal>
  );
};

// Configuration component using custom Modal with Tabs
export function CustomSelectorConfigEditor(props) {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation(NAMESPACE);
  const collection = useCollection();
  const [modalVisible, setModalVisible] = useState(false);

  // Get available fields information
  const availableFields = useMemo(() => {
    if (!collection || !fieldSchema) {
      return [];
    }

    // Get the association field
    const collectionField =
      collection.getField(fieldSchema['name']) || collection.getField(fieldSchema['x-collection-field']);

    if (!collectionField?.target) {
      return [];
    }

    // Get target collection
    const targetCollection = collection.collectionManager.getCollection(collectionField.target);

    if (!targetCollection) {
      return [];
    }

    // Get all fields from target collection
    const fields = targetCollection.getFields();

    // Format field information for display
    const formattedFields = fields
      .map((field) => ({
        name: field.name,
        title: Schema.compile(field.uiSchema?.title || field.name, { t }),
        interface: field.interface,
        type: field.type,
      }))
      .filter((field) => field.name); // Filter out fields without names

    return formattedFields;
  }, [collection, fieldSchema]);

  // Generate dynamic default render functions based on available fields
  const dynamicDefaultRenderItem = useMemo(() => {
    if (availableFields.length === 0) {
      return `function(item) { return '<span>No data</span>'; }`;
    }

    // Find the best field to display (priority: id, name, title, nickname, username, first available)
    const priorityFields = ['id', 'name', 'title', 'nickname', 'username'];
    let displayField = null;

    for (const priority of priorityFields) {
      displayField = availableFields.find((field) => field.name === priority);
      if (displayField) break;
    }

    // If no priority field found, use the first available field
    if (!displayField && availableFields.length > 0) {
      displayField = availableFields[0];
    }

    return `function(item) {
  if (!item) return '<span>No data</span>';
  var displayValue = item.${displayField.name} || '';
  return '<span>' + String(displayValue) + '</span>';
}`;
  }, [availableFields]);

  const dynamicDefaultRenderValue = useMemo(() => {
    if (availableFields.length === 0) {
      return `function(value) { return '<span>No data</span>'; }`;
    }

    // Find the best field to display (same logic as renderItem)
    const priorityFields = ['id', 'name', 'title', 'nickname', 'username'];
    let displayField = null;

    for (const priority of priorityFields) {
      displayField = availableFields.find((field) => field.name === priority);
      if (displayField) break;
    }

    // If no priority field found, use the first available field
    if (!displayField && availableFields.length > 0) {
      displayField = availableFields[0];
    }

    return `function(value) {
  if (!value) return '<span>No data</span>';
  var displayValue = value.${displayField.name} || '';
  return '<span>' + String(displayValue) + '</span>';
}`;
  }, [availableFields]);

  const handleModalOk = async (values) => {
    const { allowMultiple, customSelectorMode, renderItem, renderValue } = values;

    // If user clears the input, use dynamic default values
    const finalRenderItem = renderItem && renderItem.trim() ? renderItem.trim() : dynamicDefaultRenderItem;
    const finalRenderValue = renderValue && renderValue.trim() ? renderValue.trim() : dynamicDefaultRenderValue;

    // Save configuration to field schema
    field.componentProps = field.componentProps || {};
    field.componentProps.renderItem = finalRenderItem;
    field.componentProps.renderValue = finalRenderValue;
    field.componentProps.customSelectorMode = customSelectorMode;
    field.componentProps.allowMultiple = allowMultiple;

    _.set(fieldSchema, 'x-component-props.renderItem', finalRenderItem);
    _.set(fieldSchema, 'x-component-props.renderValue', finalRenderValue);
    _.set(fieldSchema, 'x-component-props.customSelectorMode', customSelectorMode);
    _.set(fieldSchema, 'x-component-props.allowMultiple', allowMultiple);

    const patchData = {
      schema: {
        'x-uid': fieldSchema['x-uid'],
        'x-component-props': {
          ...fieldSchema['x-component-props'],
          allowMultiple,
          customSelectorMode,
          renderItem: finalRenderItem,
          renderValue: finalRenderValue,
        },
      },
    };

    dn.emit('patch', patchData);
    // dn.refresh();

    // message.success(t('Configuration saved successfully'));
    setModalVisible(false);
  };

  return (
    <>
      <SchemaSettingsItem title={t('Configure Custom Selector')} onClick={() => setModalVisible(true)} />
      <CustomSelectorConfigModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalOk}
        field={field}
        fieldSchema={fieldSchema}
        availableFields={availableFields}
        t={t}
        dynamicDefaultRenderItem={dynamicDefaultRenderItem}
        dynamicDefaultRenderValue={dynamicDefaultRenderValue}
      />
    </>
  );
}
