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
  AssociationFieldModeProvider,
  Plugin,
  useAssociationFieldModeContext,
  useCollection,
  useDesignable,
} from '@nocobase/client';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CustomSelector } from './CustomSelector';
import { CustomSelectorConfigEditor } from './CustomSelectorSettings';
import { NAMESPACE } from './constant';

const CustomAssociationFieldModeProvider = ({ children }) => {
  const parentContext = useAssociationFieldModeContext();

  const customModeToComponent = {
    ...parentContext.modeToComponent,
    CustomSelector: CustomSelector,
  };

  return (
    <AssociationFieldModeProvider modeToComponent={customModeToComponent}>{children}</AssociationFieldModeProvider>
  );
};

class PluginCustomSelector extends Plugin {
  async load() {
    this.app.addProvider(CustomAssociationFieldModeProvider);

    const addFormatterSetting = (componentType: string) => {
      // Custom Selector switch setting
      this.app.schemaSettingsManager.addItem(componentType, 'customSelector', {
        type: 'switch',
        useVisible() {
          const collection = useCollection();
          const fieldSchema = useFieldSchema();
          const fieldComponent = collection.getField(fieldSchema['name'])?.uiSchema?.['x-component'] ?? '';
          return fieldComponent && ['AssociationField'].indexOf(fieldComponent) > -1;
        },
        useComponentProps() {
          const { t } = useTranslation(NAMESPACE);
          const { dn } = useDesignable();
          const fieldSchema = useFieldSchema();
          const field = useField();
          return {
            title: t('Custom Selector'),
            checked: !!fieldSchema['x-component-props']?.enableCustomSelector,
            onChange: async (checked) => {
              field.componentProps.enableCustomSelector = checked;
              if (checked) {
                field.componentProps.mode = 'CustomSelector';
                _.set(fieldSchema, 'x-component-props.mode', 'CustomSelector');
                _.set(fieldSchema, 'x-component-props.enableCustomSelector', checked);
              } else {
                field.componentProps.mode = 'Select';
                _.unset(fieldSchema, 'x-component-props.mode');
                _.unset(fieldSchema, 'x-component-props.enableCustomSelector');
              }

              await dn.emit('patch', {
                schema: {
                  'x-uid': fieldSchema['x-uid'],
                  'x-component-props': {
                    ...fieldSchema['x-component-props'],
                  },
                },
              });
            },
          };
        },
      });

      // Custom Selector configuration setting
      this.app.schemaSettingsManager.addItem(componentType, 'customSelectorConfig', {
        type: 'item',
        useVisible() {
          const fieldSchema = useFieldSchema();
          // Only show when Custom Selector is enabled
          return !!fieldSchema['x-component-props']?.enableCustomSelector;
        },
        Component: CustomSelectorConfigEditor,
      });
    };

    addFormatterSetting('fieldSettings:FormItem');
  }
}

export default PluginCustomSelector;
