
import React, { useMemo } from 'react';
import { ComponentType, TableProps, ComponentPlugin, ActionHandlers, DataSourceInstance } from '../../types';
import { LayoutProps, StylingProps, CollapsibleSection, PropInput, PropSelect } from './common';
import { useExpression } from '../../expressions/useExpression';
import { get } from '../../utils/data-helpers';
import { commonStylingProps } from '../../constants';

const iconStyle = { width: '24px', height: '24px', color: '#4f46e5' };

const TableRenderer: React.FC<{
  component: { props: TableProps };
  mode: 'edit' | 'preview';
  actions?: ActionHandlers;
  evaluationScope: Record<string, any>;
}> = ({ component, mode, actions, evaluationScope }) => {
  const p = component.props;
  const data = useExpression(evaluationScope[p.dataSourceName], evaluationScope, []);
  const selectedRecord = get(evaluationScope, p.selectedRecordKey || '');

  const columns = useMemo(() => {
    return p.columns.split(',').map(c => {
        const [header, key] = c.split(':');
        return { header: header.trim(), key: key ? key.trim() : header.trim().toLowerCase() };
    });
  }, [p.columns]);
  
  const handleRowClick = (row: any) => {
    if (mode === 'preview' && p.rowSelectAction === 'updateDataStore' && p.selectedRecordKey && actions) {
      actions.selectRecord(p.selectedRecordKey, row);
    }
  }

  const style = {
    borderRadius: useExpression(p.borderRadius, evaluationScope, '4px'),
    borderWidth: useExpression(p.borderWidth, evaluationScope, '1px'),
    borderColor: useExpression(p.borderColor, evaluationScope, '#e5e7eb'),
    borderStyle: p.borderStyle,
    opacity: useExpression(p.opacity, evaluationScope, 1),
    boxShadow: useExpression(p.boxShadow, evaluationScope, ''),
  };

  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div style={style} className="w-full h-full overflow-auto bg-white relative">
        <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                <tr>
                    {columns.map(col => <th key={col.header} scope="col" className="px-6 py-3">{col.header}</th>)}
                </tr>
            </thead>
            <tbody>
                {hasData && data.map((row, index) => {
                    const isSelected = selectedRecord && selectedRecord.id === row.id;
                    return (
                        <tr 
                            key={row.id || index} 
                            className={`border-b ${mode === 'preview' ? 'cursor-pointer hover:bg-gray-100' : ''} ${isSelected ? 'bg-blue-100' : 'bg-white'}`}
                            onClick={() => handleRowClick(row)}
                        >
                            {columns.map(col => (
                                <td key={col.key} className="px-6 py-4">
                                    {String(get(row, col.key, ''))}
                                </td>
                            ))}
                        </tr>
                    )
                })}
            </tbody>
        </table>
        {!hasData && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                No records found
            </div>
        )}
    </div>
  );
};

const TableProperties: React.FC<{
  component: { props: TableProps };
  updateProp: (key: keyof TableProps, value: any) => void;
  dataSources: DataSourceInstance[];
  onOpenExpressionEditor: (initialValue: string, onSave: (newValue: string) => void) => void;
}> = ({ component, updateProp, dataSources, onOpenExpressionEditor }) => {
  const p = component.props;
  const dataSourceOptions = dataSources.map(ds => ({ value: ds.id, label: ds.id }));

  return (
    <>
      <LayoutProps props={p} updateProp={updateProp} />
      <CollapsibleSection title="Data">
        <PropSelect label="Data Source" value={p.dataSourceName} onChange={val => updateProp('dataSourceName', val)} options={dataSourceOptions} />
        <PropInput label="Columns" value={p.columns} onChange={val => updateProp('columns', val)} placeholder="Header:key,Header2:key2" />
      </CollapsibleSection>
      <CollapsibleSection title="On Row Select">
         <PropSelect label="Action" value={p.rowSelectAction} onChange={val => updateProp('rowSelectAction', val)} options={[{value: 'none', label: 'None'}, {value: 'updateDataStore', label: 'Update Data Store'}]} />
         {p.rowSelectAction === 'updateDataStore' && (
            <PropInput label="Selected Record Key" value={p.selectedRecordKey} onChange={val => updateProp('selectedRecordKey', val)} placeholder="e.g. selectedRecord"/>
         )}
      </CollapsibleSection>
      <StylingProps props={p} updateProp={updateProp} onOpenExpressionEditor={onOpenExpressionEditor} />
    </>
  );
};

export const TablePlugin: ComponentPlugin = {
  type: ComponentType.TABLE,
  paletteConfig: {
    label: 'Table',
    icon: React.createElement('svg', { style: iconStyle, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg" }, React.createElement('path', { d: "M4 8h16M4 12h16M4 16h16", stroke: "currentColor", strokeWidth: "2" }), React.createElement('rect', { x: "3", y: "4", width: "18", height: "16", rx: "2", stroke: "currentColor", strokeWidth: "2" })),
    defaultProps: {
      ...commonStylingProps,
      dataSourceName: '',
      columns: 'Name:name,Email:email,Role:role',
      rowSelectAction: 'updateDataStore',
      selectedRecordKey: 'selectedRecord',
      width: 500,
      height: 300,
    },
  },
  renderer: TableRenderer,
  properties: TableProperties,
};