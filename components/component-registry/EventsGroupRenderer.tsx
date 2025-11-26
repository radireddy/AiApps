import React from 'react';
import { InputActionType, ComponentProps } from '../../types';
import { PropertyGroupRendererProps, PropertyRenderer } from '../property-groups';
import { EventHandlerProps } from './event-handlers';

const actionOptions: { value: InputActionType, label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'alert', label: 'Alert' },
  { value: 'executeCode', label: 'Execute Code' },
];

/**
 * Shared EventsGroupRenderer component for all input components
 * Provides consistent UI for event configuration across Input, Checkbox, RadioGroup, Switch, Select, Textarea
 */
export const EventsGroupRenderer: React.FC<PropertyGroupRendererProps> = ({ group, rendererProps }) => {
  const { props } = rendererProps;
  const componentProps = props as ComponentProps & EventHandlerProps;
  
  // Ensure default values for action types
  const onChangeActionType = componentProps.onChangeActionType ?? 'none';
  const onFocusActionType = componentProps.onFocusActionType ?? 'none';
  const onBlurActionType = componentProps.onBlurActionType ?? 'none';
  const onEnterActionType = componentProps.onEnterActionType ?? 'none';

  return (
    <div className="space-y-4">
      {/* On Change Section */}
      <div>
        <h5 className="text-xs font-semibold text-gray-700 mb-2">On Change</h5>
        <div className="space-y-2">
          <PropertyRenderer
            property={{
              key: 'onChangeActionType',
              label: 'Action Type',
              type: 'select',
              options: actionOptions,
              defaultValue: 'none',
            }}
            rendererProps={rendererProps}
          />
          {onChangeActionType === 'alert' && (
            <PropertyRenderer
              property={{
                key: 'onChangeAlertMessage',
                label: 'Alert Message',
                type: 'expression',
                placeholder: 'e.g., {{ "Value changed: " + event.target.value }}',
              }}
              rendererProps={rendererProps}
            />
          )}
          {onChangeActionType === 'executeCode' && (
            <PropertyRenderer
              property={{
                key: 'onChangeCodeToExecute',
                label: 'Code to Execute',
                type: 'expression',
                placeholder: 'e.g., {{ (() => { console.log(event.target.value); })() }}',
              }}
              rendererProps={rendererProps}
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-300 my-4"></div>

      {/* On Focus Section */}
      <div>
        <h5 className="text-xs font-semibold text-gray-700 mb-2">On Focus</h5>
        <div className="space-y-2">
          <PropertyRenderer
            property={{
              key: 'onFocusActionType',
              label: 'On Focus Action',
              type: 'select',
              options: actionOptions,
              defaultValue: 'none',
            }}
            rendererProps={rendererProps}
          />
          {onFocusActionType === 'alert' && (
            <PropertyRenderer
              property={{
                key: 'onFocusAlertMessage',
                label: 'Alert Message',
                type: 'expression',
                placeholder: 'e.g., {{ "Input focused" }}',
              }}
              rendererProps={rendererProps}
            />
          )}
          {onFocusActionType === 'executeCode' && (
            <PropertyRenderer
              property={{
                key: 'onFocusCodeToExecute',
                label: 'Code to Execute',
                type: 'expression',
                placeholder: 'e.g., {{ (() => { console.log("Focused"); })() }}',
              }}
              rendererProps={rendererProps}
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-300 my-4"></div>

      {/* On Blur Section */}
      <div>
        <h5 className="text-xs font-semibold text-gray-700 mb-2">On Blur</h5>
        <div className="space-y-2">
          <PropertyRenderer
            property={{
              key: 'onBlurActionType',
              label: 'On Blur Action',
              type: 'select',
              options: actionOptions,
              defaultValue: 'none',
            }}
            rendererProps={rendererProps}
          />
          {onBlurActionType === 'alert' && (
            <PropertyRenderer
              property={{
                key: 'onBlurAlertMessage',
                label: 'Alert Message',
                type: 'expression',
                placeholder: 'e.g., {{ "Input blurred" }}',
              }}
              rendererProps={rendererProps}
            />
          )}
          {onBlurActionType === 'executeCode' && (
            <PropertyRenderer
              property={{
                key: 'onBlurCodeToExecute',
                label: 'Code to Execute',
                type: 'expression',
                placeholder: 'e.g., {{ (() => { console.log("Blurred"); })() }}',
              }}
              rendererProps={rendererProps}
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-300 my-4"></div>

      {/* On Enter Key Press Section */}
      <div>
        <h5 className="text-xs font-semibold text-gray-700 mb-2">On Enter Key Press</h5>
        <div className="space-y-2">
          <PropertyRenderer
            property={{
              key: 'onEnterActionType',
              label: 'On Enter Action',
              type: 'select',
              options: actionOptions,
              defaultValue: 'none',
            }}
            rendererProps={rendererProps}
          />
          {onEnterActionType === 'alert' && (
            <PropertyRenderer
              property={{
                key: 'onEnterAlertMessage',
                label: 'Alert Message',
                type: 'expression',
                placeholder: 'e.g., {{ "Enter key pressed" }}',
              }}
              rendererProps={rendererProps}
            />
          )}
          {onEnterActionType === 'executeCode' && (
            <PropertyRenderer
              property={{
                key: 'onEnterCodeToExecute',
                label: 'Code to Execute',
                type: 'expression',
                placeholder: 'e.g., {{ (() => { console.log("Enter pressed"); })() }}',
              }}
              rendererProps={rendererProps}
            />
          )}
        </div>
      </div>
    </div>
  );
};

