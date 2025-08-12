/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import {
  Plugin,
} from '@nocobase/client';
import { tval } from '@nocobase/utils/client';
import _ from 'lodash';
import { CustomSelector } from './CustomSelector';
import { CustomSelectorConfigEditor } from './CustomSelectorSettings';
import { NAMESPACE } from './constant';

class PluginCustomSelector extends Plugin {
  async load() {
    this.app.addComponents({ FCS_Select: CustomSelector });

    // extends CollectionFieldInterface
    const interfaces = ['o2m', 'o2o', 'm2o', 'm2m'];
    interfaces.forEach((interfaceName) => {
      this.app.addFieldInterfaceComponentOption(interfaceName, {
        label: tval('Custom Selector', { ns: NAMESPACE }),
        value: 'FCS_Select',
      });
    });

    // Custom Selector configuration setting
    this.app.schemaSettingsManager.addItem('fieldSettings:FormItem', 'customSelectorConfig', {
      type: 'item',
      useVisible() {
        const fieldSchema = useFieldSchema();
        // Only show when Custom Selector is enabled
        return fieldSchema['x-component-props']?.component === 'FCS_Select';
      },
      Component: CustomSelectorConfigEditor,
    });
  }
}

export default PluginCustomSelector;
