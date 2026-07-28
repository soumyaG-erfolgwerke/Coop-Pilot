
import React, { useState, useEffect, createContext, useContext } from 'react';



export const StatusBadge = ({ status }) => {
    const styles = {
        active: 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100',
        pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100',
        inactive: 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100',
    };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
};
export const RoleBadge = ({ role }) => {
    const styles = {
        superuser: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        coopadmin: 'bg-tint text-blue-primary dark:bg-primary-dark-900 dark:text-blue-200',
        member: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
        auditer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        aud_e: 'bg-tint text-blue-primary dark:bg-primary-dark-700 dark:text-blue-200',
        aud_t: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200'
    };
    const roleText = {
        superuser: 'Super User',
        coopadmin: 'Co-op Admin',
        member: 'Member',
        auditer: 'Auditer Manager',
        aud_e: 'Auditer',
        aud_t: 'Auditer Traine'
    }
    return <span className={`px-2.5 py-1 text-xs font-semibold leading-none rounded-full ${styles[role.toLowerCase()] || styles.member}`}>{roleText[role.toLowerCase()] || role}</span>;
};

