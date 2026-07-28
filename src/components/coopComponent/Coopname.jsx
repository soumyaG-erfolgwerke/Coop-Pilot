"use client";
import React, { useState, useEffect, useMemo } from 'react';
import useCoopCache from '../../hooks/useCoopCache';


const Coopname = ({ id }) => {
    const [coop, setCoop] = useState("");
    const { getCoopById } = useCoopCache();
    useEffect(() => {
        async function getCoopname(id) {
            try {
                const nameOfCoop = await getCoopById(id);
                setCoop(nameOfCoop?.name ?? "-");
            } catch (err) {
                console.error(`❌ Failed to fetch coop name for ID: ${id}`, err);
                setCoop("-");
            }
        }
        getCoopname(id);

    }, []);

    return (
        <span>{coop}</span>
    )
}

export default Coopname;