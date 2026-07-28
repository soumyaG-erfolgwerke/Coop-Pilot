"use client";
import React from "react";
import InputFieldWrapper from "./InputFieldWrapper";
import TextInput from "./TextInput";
import SimpleSelect from "./SimpleSelect";
import SearchableSelect from "./SearchableSelect";

export default function FormBuilder({ fields, formData, handleChange, handleBlur, errors }) {
  const renderField = (field) => {
    const fieldError = field.name && errors ? errors[field.name] : undefined;

    if (field.type === "simple-select") {
      return (
        <InputFieldWrapper label={field.label} htmlFor={field.name} optional={field.optional} error={fieldError}>
          <SimpleSelect
            id={field.name}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            options={field.options}
            placeholder={field.placeholder || "Select..."}
            error={fieldError}
          />
        </InputFieldWrapper>
      );
    }

    if (field.type === "searchable") {
      return (
        <InputFieldWrapper label={field.label} htmlFor={field.name} optional={field.optional} error={fieldError}>
          <SearchableSelect
            id={field.name}
            name={field.name}
            value={formData[field.name] || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            options={field.options}
            placeholder={field.placeholder || "Select..."}
            error={fieldError}
          />
        </InputFieldWrapper>
      );
    }

    if (field.type === "composite") {
      const [left, right] = field.parts;
      return (
        <InputFieldWrapper
          label={field.label}
          htmlFor={right.name}
          required={field.required}
          description={field.description}
          errorList={[errors && errors[left.name], errors && errors[right.name]]}
        >
          <div className="flex gap-2">
            <div className={left.width || "w-32"}>
              <SearchableSelect
                id={left.name}
                name={left.name}
                value={formData[left.name] || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                options={left.options}
                placeholder={left.placeholder}
                error={errors && errors[left.name]}
              />
            </div>
            <div className="flex-1">
              <TextInput
                id={right.name}
                name={right.name}
                type={right.inputType || "text"}
                value={formData[right.name] || ""}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={right.placeholder}
                error={errors && errors[right.name]}
                icon={right.icon}
              />
            </div>
          </div>
        </InputFieldWrapper>
      );
    }

    // default text input
    return (
      <InputFieldWrapper
        label={field.label}
        htmlFor={field.name}
        required={field.required}
        optional={field.optional}
        icon={field.icon}
        description={field.description}
        error={fieldError}
      >
        <TextInput
          id={field.name}
          name={field.name}
          type={field.inputType || "text"}
          value={formData[field.name] || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={field.placeholder}
          error={fieldError}
        />
      </InputFieldWrapper>
    );
  };

  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className="space-y-6">
      {fields.map((row, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className={row.length > 1 ? `grid ${gridClasses[row.length] || "grid-cols-1"} gap-4` : ""}
        >
          {row.map((field, colIndex) => (
            <div key={field.name || `col-${colIndex}`}>
              {renderField(field)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
