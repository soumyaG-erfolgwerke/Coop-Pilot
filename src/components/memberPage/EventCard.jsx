"use client";

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, PieChart, Vote, ShieldCheck, Users, Bell, FileText, Leaf, Settings,
  LogOut, ChevronLeft, ChevronRight, Edit3, UploadCloud, Search, Filter, Plus, MoreHorizontal,
  CalendarDays, Info, CheckCircle, AlertTriangle, Sun, Moon, AlignLeft, ExternalLink, Download, ThumbsUp, ThumbsDown
} from 'lucide-react';


export default function EventCard({ title, date, description, type, urgent }) {
  return (
    <li className={`p-4 rounded-lg border-l-4 ${urgent ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30' : 'border-primary bg-blue-50 dark:bg-primary-dark-900/30'}`}>
        <p className={`text-xs font-semibold uppercase ${urgent ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-primary/80'}`}>{type} &bull; {date}</p>
        <h4 className="font-semibold text-gray-800 dark:text-gray-100 mt-0.5">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{description}</p>
        <button className="mt-2 text-sm text-blue-600 dark:text-primary/80 hover:underline">View Details</button>
    </li>
)};
