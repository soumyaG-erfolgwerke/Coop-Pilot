"use client";
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Circle, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Upload, X ,Eye,Trash2} from 'lucide-react';

// --- Reusable UI Components ---

export const Card = ({ children, className = '' }) => (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
        {children}
    </div>
);
export const Button = ({
    children,
    onClick,
    variant = 'primary',
    className = '',
    disabled = false,
    customColors = {}, // new optional prop
  }) => {
    const baseClasses =
      'px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-primary',
      secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400',
    };
  
    const finalClasses =
      customColors[variant] || variantClasses[variant] || '';
  
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${finalClasses} ${className}`}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };

export  const Input = ({ label, id, type = 'text', className = '', value, ...props }) => (
    <div>
        <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
        <input id={id} type={type} value={value || ""} className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition ${className}`} {...props} />
    </div>
);

export const Textarea = ({ label, id, className = '', value, ...props }) => (
    <div>
        <label htmlFor={id} className="block mb-1 text-sm font-medium text-gray-600">{label}</label>
        <textarea id={id} value={value || ""} className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition ${className}`} {...props} />
    </div>
);


export  const RadioGroup = ({ legend, name, options, value, onChange, layout = 'row', disabled }) => (
    <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">{legend}</legend>
        <div className={`flex gap-x-6 gap-y-3 ${layout === 'col' ? 'flex-col' : 'flex-col sm:flex-row'}`}>
            {options.map(option => (
                <div key={option.value} className="flex items-center">
                    <input
                        id={`${name}-${option.value}`}
                        name={name}
                        type="radio"
                        value={option.value}
                        checked={value === option.value}
                        onChange={onChange || (() => {})}
                        disabled={disabled}
                        readOnly={!onChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-primary"
                    />
                    <label htmlFor={`${name}-${option.value}`} className="block ml-3 text-sm text-gray-800">
                        {option.label}
                    </label>
                </div>
            ))}
        </div>
    </fieldset>
);



export const FileUploader = ({ label, onFileSelect, fileName, onDelete }) => {
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    const isFileObject = fileName instanceof File;
    const isStringURL = typeof fileName === 'string' && fileName.trim().length > 0;

    return (
        <div className="mb-4">
            <p className="mb-2 font-semibold text-gray-700">{label}</p>
            <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center justify-between flex-1 min-w-[200px] px-3 py-2 text-gray-500 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <span className="truncate">
                        {isFileObject ? fileName.name : isStringURL ? 'Change File' : 'Choose file'}
                    </span>
                    <Upload className="w-5 h-5 ml-2 text-gray-400" />
                    <input type="file" className="hidden" onChange={handleFileChange} />
                </label>

                {isStringURL && (
                    <>
                        <a
                            href={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-3 py-2 text-blue-600 border rounded-md border-primary hover:bg-blue-50"
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                        </a>
                        <button
                            onClick={onDelete}
                            type="button"
                            className="flex items-center px-3 py-2 text-red-600 border border-red-500 rounded-md hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};