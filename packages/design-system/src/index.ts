import './styles/index.css';

export { Button, type ButtonProps, type ButtonVariant } from './components/Button/Button';
export { Checkbox, type CheckboxProps } from './components/Checkbox/Checkbox';
export {
  DataGrid,
  type DataGridColumn,
  type DataGridProps,
  type DataGridSort,
} from './components/DataGrid/DataGrid';
export { Dialog, type DialogProps } from './components/Dialog/Dialog';
export { HighlightedText, type HighlightedTextProps } from './components/HighlightedText/HighlightedText';
export { Kbd, type KbdProps } from './components/Kbd/Kbd';
export { Meter, type MeterProps } from './components/Meter/Meter';
export { Panel, type PanelProps } from './components/Panel/Panel';
export { RadioGroup, type RadioGroupProps, type RadioOption } from './components/RadioGroup/RadioGroup';
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentOption,
} from './components/SegmentedControl/SegmentedControl';
export { Skeleton, type SkeletonProps } from './components/Skeleton/Skeleton';
export { SplitLayout, type SplitLayoutProps } from './components/SplitLayout/SplitLayout';
export { Stack, type SpaceToken, type StackProps } from './components/Stack/Stack';
export { StateMessage, type StateMessageProps } from './components/StateMessage/StateMessage';
export { StatusTag, type StatusTagProps, type StatusTone } from './components/StatusTag/StatusTag';
export { TextArea, type TextAreaProps } from './components/TextArea/TextArea';
export { TextField, type TextFieldProps } from './components/TextField/TextField';
export * from './icons';
export { applyTenant, TENANTS, ThemeScope, type TenantId, type ThemeScopeProps } from './theme';

/** Bumped by changesets; surfaced in the shell's platform inspector. */
export const DESIGN_SYSTEM_VERSION = __DS_VERSION__;
