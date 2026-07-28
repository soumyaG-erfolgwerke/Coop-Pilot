import {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown,
  Circle,
  CheckSquare,
  UploadCloud,
  Check,
} from "lucide-react";

export const FIELD_TYPES = [
  { value: "text", label: "Short answer", icon: <Type size={18} /> },
  { value: "textarea", label: "Paragraph", icon: <AlignLeft size={18} /> },
  { value: "number", label: "Number", icon: <Hash size={18} /> },
  { value: "date", label: "Date", icon: <Calendar size={18} /> },
  { value: "checkbox", label: "Single Checkbox", icon: <Check size={18} /> },
  { value: "file", label: "File upload", icon: <UploadCloud size={18} /> },
  {
    value: "multiple_choice",
    label: "Multiple choice",
    icon: <Circle size={18} />,
  },
  {
    value: "checkbox_group",
    label: "Checkboxes",
    icon: <CheckSquare size={18} />,
  },
  { value: "select", label: "Dropdown", icon: <ChevronDown size={18} /> },
];

export const OPTION_TYPES = ["multiple_choice", "checkbox_group", "select"];
export const TEXT_TYPES = ["text", "textarea"];
export const NUMBER_TYPES = ["number"];

export const QUESTION_SCHEMAS = {
  text: {
    componentType: "text",
    label: "Untitled Question",
    helperText: "",
    required: false,
    validation: { minLength: null, maxLength: null, pattern: "" },
  },
  textarea: {
    componentType: "textarea",
    label: "Untitled Question",
    helperText: "",
    required: false,
    validation: { minLength: null, maxLength: null, pattern: "" },
  },
  number: {
    componentType: "number",
    label: "Untitled Question",
    helperText: "",
    required: false,
    validation: { min: null, max: null },
  },
  date: {
    componentType: "date",
    label: "Untitled Question",
    helperText: "",
    required: false,
    validation: {},
  },
  checkbox: {
    componentType: "checkbox",
    label: "Untitled Question",
    helperText: "",
    required: false,
    validation: {},
  },
  file: {
    componentType: "file",
    label: "Untitled Question",
    helperText: "",
    required: false,
    validation: {},
  },
  multiple_choice: {
    componentType: "multiple_choice",
    label: "Untitled Question",
    helperText: "",
    required: false,
    validation: {},
    options: [],
    allowOther: false,
  },
  checkbox_group: {
    componentType: "checkbox_group",
    label: "Untitled Question",
    helperText: "",
    required: false,
    validation: {},
    options: [],
    allowOther: false,
  },
  select: {
    componentType: "select",
    label: "Untitled Question",
    helperText: "",
    required: false,
    validation: {},
    options: [],
  },
};

export const DEFAULT_SCHEMA = {
  title: "Untitled form",
  description: "",
  settings: {
    collectEmail: false,
    allowMultipleSubmissions: true,
    confirmationMessage: "Your response has been recorded.",
  },
  phases: [
    {
      phaseId: "phase_initial",
      title: "Basic Information",
      description: "",
      fields: [
        {
          fieldId: "field_initial",
          componentType: "multiple_choice",
          label: "Untitled Question",
          helperText: "",
          required: false,
          validation: {},
          options: [
            { id: "option_initial", label: "Option 1", value: "option_1" },
          ],
          allowOther: false,
        },
      ],
    },
  ],
};
